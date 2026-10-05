import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app.models import ScrapeLog, Project, Competitor
from app.schemas import ScrapeLogResponse, ScrapeTriggerRequest
from app.scraper.scraper_manager import scraper_manager

router = APIRouter(prefix="/api/scraper", tags=["Scraper"])

@router.post("/trigger")
async def trigger_scrape(data: ScrapeTriggerRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Start scraping asynchronously in background
    background_tasks.add_task(
        scraper_manager.run_scrape_for_project,
        project_id=data.project_id,
        competitor_ids=data.competitor_ids,
        use_simulation=data.use_simulation,
        max_posts_per_competitor=data.max_posts_per_competitor
    )

    return {
        "success": True,
        "message": f"Scrape job started for project '{project.name}'",
        "project_id": data.project_id,
        "simulation_mode": data.use_simulation
    }

@router.get("/status/{project_id}")
def get_scrape_status(project_id: int):
    status_info = scraper_manager.active_jobs.get(project_id, {"status": "idle"})
    return status_info

@router.post("/resume-captcha/{competitor_id}")
def resume_captcha(competitor_id: int):
    scraper_manager.resume_captcha(competitor_id)
    return {"success": True, "message": f"Manual CAPTCHA signal registered for competitor {competitor_id}"}

@router.get("/logs", response_model=List[ScrapeLogResponse])
def get_scrape_logs(project_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(ScrapeLog)
    if project_id:
        query = query.filter(ScrapeLog.project_id == project_id)
    logs = query.order_by(desc(ScrapeLog.started_at)).limit(limit).all()

    result = []
    for l in logs:
        comp_name = None
        if l.competitor_id:
            c = db.query(Competitor).filter(Competitor.id == l.competitor_id).first()
            if c:
                comp_name = c.name
        res = ScrapeLogResponse(
            id=l.id,
            project_id=l.project_id,
            competitor_id=l.competitor_id,
            competitor_name=comp_name,
            status=l.status,
            posts_found=l.posts_found,
            posts_added=l.posts_added,
            duplicates_skipped=l.duplicates_skipped,
            error_message=l.error_message,
            started_at=l.started_at,
            completed_at=l.completed_at,
            log_details=l.log_details or []
        )
        result.append(res)
    return result

@router.get("/events")
async def sse_scrape_events():
    """Server-Sent Events endpoint for real-time live scraper logs and updates in frontend UI"""
    queue = asyncio.Queue()
    scraper_manager.add_subscriber(queue)

    async def event_generator():
        try:
            # Send initial connection ping
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE live stream connected'})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield f": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            scraper_manager.remove_subscriber(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
