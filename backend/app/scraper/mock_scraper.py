import hashlib
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

SAMPLE_POST_TEMPLATES = [
    {
        "topic": "Special Promotions",
        "sub_topic": "Seasonal Discount",
        "content": "🌸 Spring Refresh Special! Get 25% OFF on your first comprehensive consultation and checkup when you book this week. Mention code GMAPS25 at checkout. Limited slots available! 📅",
        "call_to_action": "Book Online",
        "cta_url": "https://maps.google.com/booking-promo",
        "content_type": "Promotion",
        "promotions": "25% OFF first consultation with code GMAPS25",
        "keywords": ["discount", "consultation", "spring special", "limited slots"],
        "images": ["https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "Customer Showcase",
        "sub_topic": "Success Story",
        "content": "✨ Look at this incredible transformation! Sarah came to us 6 months ago looking for a brighter, healthier smile. Today we completed her customized alignment plan. Thank you for trusting our team! 💖",
        "call_to_action": "Learn More",
        "cta_url": "https://maps.google.com/case-studies",
        "content_type": "Case Study",
        "promotions": None,
        "keywords": ["transformation", "results", "client review", "customized care"],
        "images": ["https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "Educational Tips",
        "sub_topic": "Preventative Care",
        "content": "💡 Pro Tip Tuesday: Did you know that 80% of long-term issues can be prevented with regular bi-annual checkups? Don't wait until something hurts. Save this post and tag a friend who needs a reminder!",
        "call_to_action": "Call Now",
        "cta_url": "tel:+12125550199",
        "content_type": "Educational",
        "promotions": None,
        "keywords": ["pro tip", "preventative care", "health tips", "checkup"],
        "images": ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "New Technology",
        "sub_topic": "Equipment Upgrade",
        "content": "🚀 We have upgraded our facility! We just installed the latest 3D digital imaging scanner. Faster, 100% painless, and ultra-precise diagnostics for all our patients starting Monday.",
        "call_to_action": "View Updates",
        "cta_url": "https://maps.google.com/tech-announcement",
        "content_type": "Announcement",
        "promotions": None,
        "keywords": ["new tech", "upgrade", "digital scanning", "modern facility"],
        "images": ["https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "Community & Team",
        "sub_topic": "Staff Spotlight",
        "content": "👋 Meet Dr. Evelyn Vance! With over 12 years of specialized experience, Dr. Vance brings unmatched passion and gentle care to every single appointment. Say hi to her in the comments below! 👇",
        "call_to_action": "Meet Our Team",
        "cta_url": "https://maps.google.com/team",
        "content_type": "Announcement",
        "promotions": None,
        "keywords": ["team spotlight", "meet the doctor", "friendly staff", "experience"],
        "images": ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "Holiday Hours",
        "sub_topic": "Schedule Notice",
        "content": "⏰ Holiday Weekend Schedule: We will be open for emergency cases this Saturday from 9 AM to 2 PM. Regular hours resume Monday. Call our direct hotline for urgent inquiries!",
        "call_to_action": "Call Emergency Hotline",
        "cta_url": "tel:+12125550199",
        "content_type": "Announcement",
        "promotions": None,
        "keywords": ["weekend hours", "emergency hotline", "schedule update"],
        "images": ["https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60"]
    },
    {
        "topic": "Weekend Giveaway",
        "sub_topic": "Social Contest",
        "content": "🎁 GIVEAWAY ALERT! Leave a Google review sharing your recent experience with us, and you'll be automatically entered to win a complimentary deluxe care basket worth $200! Winner announced on the 30th. 🏆",
        "call_to_action": "Write a Review",
        "cta_url": "https://maps.google.com/review",
        "content_type": "Promotion",
        "promotions": "Complimentary deluxe care basket worth $200 raffle",
        "keywords": ["giveaway", "google review", "raffle", "contest"],
        "images": ["https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop&q=60"]
    }
]

def generate_mock_competitor_posts(business_name: str, maps_url: str, count: int = 5) -> List[Dict[str, Any]]:
    """Generates realistic Google Maps competitor posts for instant demo or testing."""
    posts = []
    selected_templates = random.sample(SAMPLE_POST_TEMPLATES, min(count, len(SAMPLE_POST_TEMPLATES)))
    
    for i, tpl in enumerate(selected_templates):
        days_ago = (i * 3) + random.randint(1, 4)
        post_date = datetime.utcnow() - timedelta(days=days_ago)
        post_date_raw = f"{days_ago} days ago" if days_ago < 30 else f"{days_ago // 7} weeks ago"
        
        # Replace business context in text
        content = tpl["content"].replace("our team", f"the team at {business_name}")
        
        raw_key = f"{business_name.strip()}||{content.strip()}||{post_date_raw}"
        content_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        
        posts.append({
            "business_name": business_name,
            "profile_url": maps_url,
            "post_url": f"{maps_url}#post-{content_hash[:8]}",
            "content_hash": content_hash,
            "content": content,
            "post_date": post_date,
            "post_date_raw": post_date_raw,
            "images": tpl["images"],
            "call_to_action": tpl["call_to_action"],
            "cta_url": tpl["cta_url"],
            "topic": tpl["topic"],
            "sub_topic": tpl["sub_topic"],
            "keywords": tpl["keywords"],
            "content_type": tpl["content_type"],
            "promotions": tpl["promotions"],
            "sentiment": "Positive",
            "ai_analyzed": True,
            "ai_analysis_raw": {
                "topic": tpl["topic"],
                "sub_topic": tpl["sub_topic"],
                "keywords": tpl["keywords"],
                "content_type": tpl["content_type"],
                "promotions": tpl["promotions"],
                "sentiment": "Positive"
            }
        })
    
    return posts
