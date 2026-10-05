import json
import re
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class MultiProviderAIAnalyzer:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    async def analyze_post(self, post_content: str, business_name: str = "", provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes a Google Maps post using either Gemini, OpenAI, or smart Heuristic engine.
        Returns:
            dict containing:
                topic, sub_topic, keywords, content_type,
                call_to_action, promotions, sentiment, ai_provider
        """
        chosen_provider = provider or settings.DEFAULT_AI_PROVIDER

        # If user selected gemini and key exists
        if chosen_provider == "gemini" and self.gemini_key:
            try:
                return await self._analyze_with_gemini(post_content, business_name)
            except Exception as e:
                logger.warning(f"Gemini API error ({e}), trying OpenAI or heuristic fallback.")

        # If user selected openai or fallback to openai
        if (chosen_provider == "openai" or not self.gemini_key) and self.openai_key:
            try:
                return await self._analyze_with_openai(post_content, business_name)
            except Exception as e:
                logger.warning(f"OpenAI API error ({e}), trying heuristic fallback.")

        # Fallback to high quality rule-based heuristic extraction
        return self._analyze_heuristic(post_content, business_name)

    async def _analyze_with_gemini(self, content: str, business_name: str) -> Dict[str, Any]:
        prompt = f"""
You are an expert Google Maps Business Profile intelligence analyzer.
Analyze the following Google Maps Update/Post from competitor '{business_name}':

"{content}"

Return a strict JSON object with these exact keys:
{{
  "topic": "High-level topic (e.g. Special Promotion, Educational Tips, Customer Showcase, New Service, Team News)",
  "sub_topic": "Specific sub-topic (e.g. 20% Off Spring Sale, Preventative Dental Care, 5-Star Review)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "content_type": "Promotion | Announcement | Educational | Case Study | Event",
  "call_to_action": "Suggested CTA (e.g. Book Appointment, Call Now, Learn More, Claim Discount)",
  "promotions": "Description of any discount, coupon or offer, or null if none",
  "sentiment": "Positive | Neutral | Urgent | Excited"
}}
Return ONLY raw JSON, without markdown backticks.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean JSON markdown fences if present
            raw_text = re.sub(r"^```json\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)
            parsed = json.loads(raw_text)
            parsed["ai_provider"] = "gemini-1.5-flash"
            return parsed

    async def _analyze_with_openai(self, content: str, business_name: str) -> Dict[str, Any]:
        prompt = f"""
Analyze the following Google Maps post from business '{business_name}':
"{content}"

Return a strict JSON object with:
{{
  "topic": "High-level topic",
  "sub_topic": "Specific sub-topic",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "content_type": "Promotion | Announcement | Educational | Case Study | Event",
  "call_to_action": "CTA text",
  "promotions": "Extracted offer or null",
  "sentiment": "Positive | Neutral | Urgent | Excited"
}}
"""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                url,
                headers=headers,
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You output only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
            )
            resp.raise_for_status()
            res_data = resp.json()
            raw_text = res_data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_text)
            parsed["ai_provider"] = "gpt-4o-mini"
            return parsed

    def _analyze_heuristic(self, content: str, business_name: str) -> Dict[str, Any]:
        """Instant offline fallback analyzer that accurately extracts metadata."""
        lower = content.lower()
        
        # 1. Promotions extraction
        promo_match = re.search(r"(\d+%\s*(?:off|discount)|\$\d+\s*(?:off|discount|voucher)|code\s+[A-Z0-9]+|free\s+[a-z\s]+|giveaway|raffle)", content, re.IGNORECASE)
        promotions = promo_match.group(0) if promo_match else None

        # 2. Content Type & Topic classification
        if promotions or any(w in lower for w in ["sale", "discount", "offer", "special", "limited time", "save", "voucher", "bogo"]):
            content_type = "Promotion"
            topic = "Special Promotions"
            sub_topic = "Discounts & Offers"
        elif any(w in lower for w in ["tip", "did you know", "how to", "guide", "advice", "faq", "myth", "prevent"]):
            content_type = "Educational"
            topic = "Educational Tips"
            sub_topic = "Industry Knowledge & Advice"
        elif any(w in lower for w in ["transformation", "before and after", "patient", "client", "thank you", "review", "testimonial", "star"]):
            content_type = "Case Study"
            topic = "Customer Showcase"
            sub_topic = "Success Stories & Reviews"
        elif any(w in lower for w in ["meet", "welcome", "dr.", "doctor", "team", "staff", "celebrating", "anniversary", "congrats"]):
            content_type = "Announcement"
            topic = "Team & Culture"
            sub_topic = "Staff Spotlight"
        elif any(w in lower for w in ["hours", "holiday", "closed", "schedule", "upgrade", "new", "scanner", "technology", "equipment"]):
            content_type = "Announcement"
            topic = "Business Operations"
            sub_topic = "Updates & Hours"
        else:
            content_type = "Announcement"
            topic = "General Update"
            sub_topic = "General News"

        # 3. Call to Action detector
        cta = "Learn More"
        if any(w in lower for w in ["book", "appointment", "schedule", "reserve"]):
            cta = "Book Online"
        elif any(w in lower for w in ["call", "phone", "hotline", "dial", "ring"]):
            cta = "Call Now"
        elif any(w in lower for w in ["order", "menu", "delivery", "takeout"]):
            cta = "Order Online"
        elif any(w in lower for w in ["claim", "code", "redeem"]):
            cta = "Claim Offer"
        elif any(w in lower for w in ["review", "feedback", "rating"]):
            cta = "Write a Review"

        # 4. Keyword extraction
        words = re.findall(r"\b[A-Za-z]{4,}\b", content)
        stopwords = {"this", "that", "with", "have", "from", "your", "will", "they", "what", "about", "which", "when", "make", "time", "just", "know", "take", "into", "year", "some", "them", "people", "would", "come", "more", "look", "like"}
        filtered = [w.lower() for w in words if w.lower() not in stopwords]
        
        # Frequency count
        freq: Dict[str, int] = {}
        for w in filtered:
            freq[w] = freq.get(w, 0) + 1
        sorted_keywords = sorted(freq.keys(), key=lambda x: freq[x], reverse=True)[:5]
        if not sorted_keywords:
            sorted_keywords = ["update", "service", "quality"]

        # 5. Sentiment
        sentiment = "Positive"
        if any(w in lower for w in ["urgent", "hurry", "fast", "limited", "today only"]):
            sentiment = "Urgent"
        elif any(w in lower for w in ["excited", "thrilled", "proud", "amazing", "incredible"]):
            sentiment = "Excited"

        return {
            "topic": topic,
            "sub_topic": sub_topic,
            "keywords": sorted_keywords,
            "content_type": content_type,
            "call_to_action": cta,
            "promotions": promotions,
            "sentiment": sentiment,
            "ai_provider": "heuristic-engine (built-in)"
        }

ai_analyzer = MultiProviderAIAnalyzer()
