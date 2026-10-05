import hashlib
import time
import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

from app.config import settings

logger = logging.getLogger(__name__)

class GoogleMapsSeleniumScraper:
    def __init__(self, headless: bool = True, on_captcha: Optional[Callable[[str], None]] = None):
        self.headless = headless
        self.on_captcha = on_captcha
        self.driver: Optional[webdriver.Chrome] = None

    def _init_driver(self):
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        
        # Experimental options to reduce bot detection
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.set_page_load_timeout(settings.SCRAPE_TIMEOUT_SECONDS)
        except Exception as e:
            logger.error(f"Failed to initialize ChromeDriver: {e}")
            raise e

    def _check_for_captcha(self) -> bool:
        if not self.driver:
            return False
        page_source = self.driver.page_source.lower()
        captcha_indicators = [
            "recaptcha",
            "unusual traffic from your computer network",
            "sorry/index",
            "google.com/sorry",
            "enter the characters you see below",
            "please solve the captcha"
        ]
        for indicator in captcha_indicators:
            if indicator in page_source:
                logger.warning(f"CAPTCHA detected via indicator: {indicator}")
                return True
        return False

    def _handle_consent_modal(self):
        """Handle Google cookie consent dialogs if present"""
        if not self.driver:
            return
        try:
            # Common Google consent buttons: 'Accept all', 'I agree', 'Accept'
            consent_buttons = self.driver.find_elements(By.XPATH, "//button[contains(., 'Accept all') or contains(., 'I agree') or contains(., 'Reject all') or contains(., 'Alle akzeptieren')]")
            if consent_buttons:
                consent_buttons[0].click()
                time.sleep(1)
        except Exception:
            pass

    def compute_content_hash(self, business_name: str, content: str, post_date_raw: str = "") -> str:
        raw_key = f"{business_name.strip()}||{content.strip()}||{post_date_raw.strip()}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def scrape_competitor_posts(self, maps_url: str, business_name: str, max_posts: int = 15) -> Dict[str, Any]:
        """
        Navigates to Google Maps URL, finds updates/posts, and extracts metadata.
        Returns:
            dict with {
                "success": bool,
                "posts": list of dicts,
                "captcha_detected": bool,
                "error": str or None,
                "profile_info": dict
            }
        """
        result = {
            "success": False,
            "posts": [],
            "captcha_detected": False,
            "error": None,
            "profile_info": {
                "business_name": business_name,
                "rating": None,
                "reviews_count": None,
                "address": None
            }
        }

        try:
            if not self.driver:
                self._init_driver()

            logger.info(f"Opening Google Maps profile: {maps_url}")
            self.driver.get(maps_url)
            time.sleep(settings.SCRAPE_DELAY_SECONDS)

            # Check CAPTCHA
            if self._check_for_captcha():
                result["captcha_detected"] = True
                result["error"] = "Google CAPTCHA encountered. Manual intervention or pause required."
                if self.on_captcha:
                    self.on_captcha(business_name)
                return result

            self._handle_consent_modal()

            # Wait for main container
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//div[contains(@role, 'main')] | //h1"))
                )
            except TimeoutException:
                pass

            # Extract business name if missing
            try:
                h1_elements = self.driver.find_elements(By.TAG_NAME, "h1")
                if h1_elements and h1_elements[0].text:
                    result["profile_info"]["business_name"] = h1_elements[0].text.strip()
            except Exception:
                pass

            # Extract Rating & reviews if available
            try:
                rating_el = self.driver.find_elements(By.XPATH, "//span[contains(@aria-label, 'stars') or contains(@class, 'ceNzKf')]")
                if rating_el:
                    aria = rating_el[0].get_attribute("aria-label") or rating_el[0].text
                    # Extract number
                    for part in aria.split():
                        try:
                            result["profile_info"]["rating"] = float(part.replace(",", "."))
                            break
                        except ValueError:
                            continue
            except Exception:
                pass

            # Look for Updates / Posts tab
            # Google Maps tabs: Overview, Services, Reviews, Updates/About
            posts_found = []
            try:
                updates_tabs = self.driver.find_elements(By.XPATH, 
                    "//button[contains(@aria-label, 'Updates') or contains(@aria-label, 'Posts') or contains(., 'Updates') or contains(., 'Posts')]"
                )
                if updates_tabs:
                    updates_tabs[0].click()
                    time.sleep(2)
            except Exception as e:
                logger.info(f"Updates tab click attempt: {e}")

            # Extract Post cards
            # Google Business update post containers typically have distinct role or class structures
            post_selectors = [
                "//div[contains(@class, 'gws-local-posts-card')]",
                "//div[contains(@role, 'article')]",
                "//div[contains(@data-post-id, '') and not(contains(@data-post-id, 'none'))]",
                "//div[contains(@class, 'A8h41e') or contains(@class, 'm6QErb')]//div[contains(@class, 'fontBodyMedium')]/ancestor::div[contains(@class, 'm6QErb')]"
            ]

            card_elements = []
            for sel in post_selectors:
                elements = self.driver.find_elements(By.XPATH, sel)
                if len(elements) > 0:
                    card_elements = elements
                    break

            # If no structured cards matched, fallback to finding text blocks with dates and CTA links
            if not card_elements:
                card_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'fontBodyMedium')]")

            extracted_count = 0
            for card in card_elements[:max_posts]:
                try:
                    text_content = card.text.strip()
                    if not text_content or len(text_content) < 15:
                        continue

                    # Extract Images
                    images = []
                    img_elements = card.find_elements(By.TAG_NAME, "img")
                    for img in img_elements:
                        src = img.get_attribute("src")
                        if src and not src.startswith("data:image/svg") and "googleusercontent" in src:
                            images.append(src)

                    # Extract CTA button/link
                    cta_text = None
                    cta_link = None
                    cta_elements = card.find_elements(By.XPATH, ".//a[contains(@role, 'button') or contains(@class, 'CsEnBe') or @href]")
                    if cta_elements:
                        cta_text = cta_elements[0].text.strip() or "Learn More"
                        cta_link = cta_elements[0].get_attribute("href")

                    # Extract Date
                    post_date_raw = "Recently"
                    date_elements = card.find_elements(By.XPATH, ".//span[contains(text(), 'ago') or contains(text(), 'day') or contains(text(), 'week') or contains(text(), 'month')]")
                    if date_elements:
                        post_date_raw = date_elements[0].text.strip()

                    # Extract post URL if present
                    post_url = maps_url
                    if cta_link and "google.com" in cta_link:
                        post_url = cta_link

                    content_hash = self.compute_content_hash(
                        business_name=result["profile_info"]["business_name"],
                        content=text_content,
                        post_date_raw=post_date_raw
                    )

                    post_obj = {
                        "business_name": result["profile_info"]["business_name"],
                        "profile_url": maps_url,
                        "post_url": post_url,
                        "content": text_content,
                        "content_hash": content_hash,
                        "post_date_raw": post_date_raw,
                        "post_date": datetime.utcnow(),
                        "images": images,
                        "call_to_action": cta_text,
                        "cta_url": cta_link,
                    }
                    posts_found.append(post_obj)
                    extracted_count += 1
                except Exception as card_err:
                    logger.debug(f"Error parsing post card: {card_err}")
                    continue

            result["posts"] = posts_found
            result["success"] = True

        except Exception as e:
            logger.error(f"Error in Selenium scrape for {business_name}: {e}")
            result["error"] = str(e)
            result["success"] = False

        return result

    def close(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None
