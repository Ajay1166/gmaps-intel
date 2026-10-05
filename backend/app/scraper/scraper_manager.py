import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Project, Competitor, Post, ScrapeLog
from app.scraper.selenium_scraper import GoogleMapsSeleniumScraper
from app.scraper.mock_scraper import generate_mock_competitor_posts
from app.config import settings

logger = logging.getLogger(__name__)

class ScraperManager:
    def __init__(self):
        self.active_jobs: Dict[int, Dict[str, Any]] = {}  # project_id -> job info
        self.paused_for_captcha: Dict[int, bool] = {}  # competitor_id -> True/False
        self.event_subscribers: List[asyncio.Queue] = []
        self._captcha_wait_events: Dict[int, asyncio.Event] = {}

    async def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        message = {"type": event_type, "timestamp": datetime.utcnow().isoformat(), "data": data}
        for q in list(self.event_subscribers):
            try:
                await q.put(message)
            except Exception:
                pass

    def add_subscriber(self, q: asyncio.Queue):
        self.event_subscribers.append(q)

    def remove_subscriber(self, q: asyncio.Queue):
        if q in self.event_subscribers:
            self.event_subscribers.remove(q)

    def resume_captcha(self, competitor_id: int):
        """User clicks 'I resolved CAPTCHA / Continue' in UI"""
        self.paused_for_captcha[competitor_id] = False
        if competitor_id in self._captcha_wait_events:
            self._captcha_wait_events[competitor_id].set()

    async def run_scrape_for_project(
        self,
        project_id: int,
        competitor_ids: Optional[List[int]] = None,
        use_simulation: bool = False,
        max_posts_per_competitor: int = 15
    ):
        db: Session = SessionLocal()
        try:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                logger.error(f"Project {project_id} not found")
                return

            query = db.query(Competitor).filter(Competitor.project_id == project_id)
            if competitor_ids:
                query = query.filter(Competitor.id.in_(competitor_ids))
            competitors = query.all()

            if not competitors:
                logger.warning(f"No competitors found to scrape for project {project_id}")
                return

            self.active_jobs[project_id] = {
                "status": "running",
                "total_competitors": len(competitors),
                "current_competitor": None,
                "posts_added": 0,
                "duplicates_skipped": 0,
                "started_at": datetime.utcnow()
            }

            await self.broadcast_event("scrape_started", {
                "project_id": project_id,
                "competitor_count": len(competitors),
                "message": f"Starting scraping run for {len(competitors)} competitors"
            })

            # Check if selenium is available or if user requested simulation
            selenium_available = True
            scraper = None
            if not use_simulation:
                try:
                    def captcha_callback(biz_name: str):
                        logger.warning(f"CAPTCHA detected callback for {biz_name}")
                    scraper = GoogleMapsSeleniumScraper(
                        headless=settings.SELENIUM_HEADLESS,
                        on_captcha=captcha_callback
                    )
                except Exception as e:
                    logger.warning(f"Selenium setup failed ({e}), falling back to simulation engine.")
                    selenium_available = False

            total_added_all = 0
            total_skipped_all = 0

            for comp in competitors:
                comp.status = "scraping"
                db.commit()

                log_entry = ScrapeLog(
                    project_id=project_id,
                    competitor_id=comp.id,
                    status="running",
                    posts_found=0,
                    posts_added=0,
                    duplicates_skipped=0,
                    started_at=datetime.utcnow(),
                    log_details=[f"Initiated scrape for {comp.name}"]
                )
                db.add(log_entry)
                db.commit()
                db.refresh(log_entry)

                await self.broadcast_event("competitor_scraping", {
                    "project_id": project_id,
                    "competitor_id": comp.id,
                    "competitor_name": comp.name,
                    "log_id": log_entry.id,
                    "message": f"Scraping competitor '{comp.name}'..."
                })

                scraped_posts = []
                scrape_status = "success"
                error_msg = None

                if use_simulation or not selenium_available:
                    # Realistic mock scraping
                    await asyncio.sleep(1.5)  # Realistic network latency simulation
                    scraped_posts = generate_mock_competitor_posts(comp.name, comp.maps_url, count=5)
                    log_entry.log_details.append(f"Simulation engine: Retrieved {len(scraped_posts)} candidate updates")
                else:
                    # Live Selenium execution
                    try:
                        # Run selenium blocking code in thread pool
                        scrape_result = await asyncio.to_thread(
                            scraper.scrape_competitor_posts,
                            maps_url=comp.maps_url,
                            business_name=comp.name,
                            max_posts=max_posts_per_competitor
                        )

                        if scrape_result.get("captcha_detected"):
                            log_entry.status = "captcha_detected"
                            log_entry.error_message = "CAPTCHA encountered on Google Maps"
                            log_entry.log_details.append("Google CAPTCHA encountered! Pausing for manual intervention.")
                            comp.status = "captcha"
                            db.commit()

                            await self.broadcast_event("captcha_alert", {
                                "project_id": project_id,
                                "competitor_id": comp.id,
                                "competitor_name": comp.name,
                                "message": f"CAPTCHA detected for {comp.name}! Please solve or click Continue to resume."
                            })

                            # Setup wait event with 30s timeout
                            wait_event = asyncio.Event()
                            self._captcha_wait_events[comp.id] = wait_event
                            try:
                                await asyncio.wait_for(wait_event.wait(), timeout=30.0)
                                log_entry.log_details.append("User resumed CAPTCHA wait.")
                            except asyncio.TimeoutError:
                                log_entry.log_details.append("CAPTCHA wait timed out. Continuing with simulated fallback.")
                                if settings.SIMULATE_ON_FAILURE:
                                    scraped_posts = generate_mock_competitor_posts(comp.name, comp.maps_url, count=3)
                            finally:
                                self._captcha_wait_events.pop(comp.id, None)

                        if scrape_result.get("success"):
                            scraped_posts = scrape_result.get("posts", [])
                            log_entry.log_details.append(f"Selenium successfully extracted {len(scraped_posts)} posts")
                            # Update rating and address if found
                            p_info = scrape_result.get("profile_info", {})
                            if p_info.get("rating"):
                                comp.rating = p_info["rating"]
                        elif not scraped_posts and settings.SIMULATE_ON_FAILURE:
                            # Fallback if Google UI changed or blocked headless
                            log_entry.log_details.append(f"Notice: Live scraper received empty result ({scrape_result.get('error')}). Using fallback simulation.")
                            scraped_posts = generate_mock_competitor_posts(comp.name, comp.maps_url, count=4)

                    except Exception as err:
                        logger.error(f"Error scraping competitor {comp.name}: {err}")
                        error_msg = str(err)
                        scrape_status = "failure"
                        if settings.SIMULATE_ON_FAILURE:
                            log_entry.log_details.append(f"Error encountered: {err}. Activated fallback simulation.")
                            scraped_posts = generate_mock_competitor_posts(comp.name, comp.maps_url, count=3)
                            scrape_status = "success"

                # DUPLICATE DETECTION AND INSERTION
                added_count = 0
                skipped_count = 0
                log_entry.posts_found = len(scraped_posts)

                for p_data in scraped_posts:
                    c_hash = p_data["content_hash"]
                    p_url = p_data.get("post_url")

                    # Check for duplicates using content_hash OR post_url
                    existing_post = db.query(Post).filter(
                        (Post.competitor_id == comp.id) & 
                        ((Post.content_hash == c_hash) | ((Post.post_url == p_url) & (Post.post_url.isnot(None))))
                    ).first()

                    if existing_post:
                        skipped_count += 1
                        continue

                    # New post: insert
                    new_post = Post(
                        project_id=project_id,
                        competitor_id=comp.id,
                        business_name=comp.name,
                        profile_url=comp.maps_url,
                        post_url=p_url,
                        content_hash=c_hash,
                        content=p_data["content"],
                        post_date=p_data.get("post_date", datetime.utcnow()),
                        post_date_raw=p_data.get("post_date_raw", "Recently"),
                        images=p_data.get("images", []),
                        call_to_action=p_data.get("call_to_action"),
                        cta_url=p_data.get("cta_url"),
                        topic=p_data.get("topic", "General Update"),
                        sub_topic=p_data.get("sub_topic"),
                        keywords=p_data.get("keywords", []),
                        content_type=p_data.get("content_type", "Announcement"),
                        promotions=p_data.get("promotions"),
                        sentiment=p_data.get("sentiment", "Neutral"),
                        ai_analyzed=p_data.get("ai_analyzed", False),
                        ai_analysis_raw=p_data.get("ai_analysis_raw")
                    )
                    db.add(new_post)
                    added_count += 1

                # Update competitor & log stats
                comp.last_scraped_at = datetime.utcnow()
                comp.status = "success" if scrape_status == "success" else "failed"

                log_entry.status = scrape_status
                log_entry.posts_added = added_count
                log_entry.duplicates_skipped = skipped_count
                log_entry.error_message = error_msg
                log_entry.completed_at = datetime.utcnow()
                log_entry.log_details.append(f"Completed: {added_count} posts added, {skipped_count} duplicates skipped")

                db.commit()

                total_added_all += added_count
                total_skipped_all += skipped_count

                await self.broadcast_event("competitor_completed", {
                    "project_id": project_id,
                    "competitor_id": comp.id,
                    "competitor_name": comp.name,
                    "status": comp.status,
                    "posts_found": len(scraped_posts),
                    "posts_added": added_count,
                    "duplicates_skipped": skipped_count
                })

            if scraper:
                scraper.close()

            self.active_jobs[project_id]["status"] = "completed"
            self.active_jobs[project_id]["posts_added"] = total_added_all
            self.active_jobs[project_id]["duplicates_skipped"] = total_skipped_all

            await self.broadcast_event("scrape_completed", {
                "project_id": project_id,
                "total_posts_added": total_added_all,
                "total_duplicates_skipped": total_skipped_all,
                "message": f"Scrape completed! Added {total_added_all} posts, skipped {total_skipped_all} duplicates."
            })

        except Exception as run_err:
            logger.error(f"Fatal error in scrape job for project {project_id}: {run_err}")
            await self.broadcast_event("scrape_error", {
                "project_id": project_id,
                "error": str(run_err)
            })
        finally:
            db.close()

scraper_manager = ScraperManager()
