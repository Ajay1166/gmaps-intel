import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, engine, Base
from app.models import Project, Competitor, Post, ScrapeLog, GeneratedContent

router = APIRouter(prefix="/api/seed", tags=["Demo Data Seed"])

def run_db_seed(db: Session):
    # Check if already seeded
    if db.query(Project).count() > 0:
        return {"status": "already_seeded", "message": "Database already contains projects."}

    # 1. Project 1: Dental Intelligence
    project1 = Project(
        name="Apex Family Dental - Manhattan Intel",
        description="Monitoring competitor Google Business Profile updates, promotions, and seasonal campaigns in Midtown & Downtown Manhattan.",
        business_name="Apex Family & Cosmetic Dental",
        business_profile_url="https://maps.google.com/?cid=1001",
        business_keywords=["invisalign", "teeth whitening", "emergency dentist", "dental implants", "family dentistry"],
        industry="Dental Practice",
        location="New York, NY"
    )
    db.add(project1)
    db.commit()
    db.refresh(project1)

    # Competitors for Project 1
    competitors_data = [
        {
            "name": "BrightSmile Dental Studio",
            "maps_url": "https://maps.google.com/?cid=2001",
            "address": "450 Lexington Ave, New York, NY 10017",
            "rating": 4.9,
            "reviews_count": 512,
            "status": "success",
            "last_scraped_at": datetime.utcnow() - timedelta(hours=3)
        },
        {
            "name": "Tribeca Premier Dentistry",
            "maps_url": "https://maps.google.com/?cid=2002",
            "address": "120 Hudson St, New York, NY 10013",
            "rating": 4.8,
            "reviews_count": 348,
            "status": "success",
            "last_scraped_at": datetime.utcnow() - timedelta(hours=5)
        },
        {
            "name": "Midtown Modern Dental Care",
            "maps_url": "https://maps.google.com/?cid=2003",
            "address": "30 Rockefeller Plaza, New York, NY 10112",
            "rating": 4.7,
            "reviews_count": 289,
            "status": "success",
            "last_scraped_at": datetime.utcnow() - timedelta(hours=8)
        },
        {
            "name": "Gramercy Park Smiles",
            "maps_url": "https://maps.google.com/?cid=2004",
            "address": "14 Gramercy Park S, New York, NY 10003",
            "rating": 4.6,
            "reviews_count": 175,
            "status": "idle",
            "last_scraped_at": None
        }
    ]

    comp_objs = []
    for cd in competitors_data:
        comp = Competitor(project_id=project1.id, **cd)
        db.add(comp)
        db.commit()
        db.refresh(comp)
        comp_objs.append(comp)

    # Posts for competitors
    c1, c2, c3, c4 = comp_objs[0], comp_objs[1], comp_objs[2], comp_objs[3]

    raw_posts = [
        # Competitor 1: BrightSmile
        {
            "comp": c1,
            "content": "✨ Spring Smile Transformation! Dr. Lee just finished an amazing 8-month clear aligner case. Patient is ecstatic with the natural results! Book your free 3D digital smile simulation scan this week. 🦷✨",
            "days_ago": 2,
            "topic": "Customer Showcase",
            "sub_topic": "Clear Aligner Transformation",
            "content_type": "Case Study",
            "cta": "Book Online",
            "cta_url": "https://maps.google.com/booking-aligners",
            "promotions": "Free 3D digital smile simulation scan",
            "keywords": ["clear aligners", "smile simulation", "3d scan", "transformation"],
            "images": ["https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=60"]
        },
        {
            "comp": c1,
            "content": "🎉 FLASH SALE: 20% OFF Professional In-Office Teeth Whitening sessions scheduled between Monday & Thursday! Limited to the first 15 appointments. Mention code BRIGHT20. 🌟",
            "days_ago": 5,
            "topic": "Special Promotions",
            "sub_topic": "Whitening Flash Sale",
            "content_type": "Promotion",
            "cta": "Claim Offer",
            "cta_url": "https://maps.google.com/promo-whitening",
            "promotions": "20% OFF Professional Teeth Whitening with code BRIGHT20",
            "keywords": ["teeth whitening", "flash sale", "discount", "code bright20"],
            "images": ["https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=60"]
        },
        {
            "comp": c1,
            "content": "💡 Pro Health Tip: Flossing before brushing actually allows fluoride from your toothpaste to reach between teeth more effectively! Small habits yield massive lifelong benefits. Save this for your routine! 🪥",
            "days_ago": 9,
            "topic": "Educational Tips",
            "sub_topic": "Daily Flossing Technique",
            "content_type": "Educational",
            "cta": "Learn More",
            "cta_url": "https://maps.google.com/health-tips",
            "promotions": None,
            "keywords": ["pro tip", "flossing routine", "preventative dentistry", "hygiene"],
            "images": ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60"]
        },
        # Competitor 2: Tribeca Premier
        {
            "comp": c2,
            "content": "🚨 Experiencing sudden tooth pain or an unexpected dental emergency in Downtown NYC? We reserve same-day emergency slots every morning. Call our priority emergency desk immediately!",
            "days_ago": 3,
            "topic": "Business Operations",
            "sub_topic": "Same-Day Emergency Coverage",
            "content_type": "Announcement",
            "cta": "Call Now",
            "cta_url": "tel:+12125550188",
            "promotions": None,
            "keywords": ["emergency dentist", "tooth pain", "same day slot", "downtown nyc"],
            "images": ["https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60"]
        },
        {
            "comp": c2,
            "content": "👋 Meet Dr. Sophia Patel! Joining Tribeca Premier with specialized credentials from Columbia Dental in advanced aesthetic restorations and minimally invasive techniques. Welcome Dr. Patel!",
            "days_ago": 7,
            "topic": "Team & Culture",
            "sub_topic": "New Specialist Announcement",
            "content_type": "Announcement",
            "cta": "Meet Our Team",
            "cta_url": "https://maps.google.com/team-patel",
            "promotions": None,
            "keywords": ["meet the doctor", "columbia dental", "aesthetic restoration", "specialist"],
            "images": ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60"]
        },
        {
            "comp": c2,
            "content": "🌸 Spring Wellness Package: Comprehensive exam, full-mouth panoramic digital X-rays, and ultrasonic cleaning for just $149 for new uninsured patients! (Regular value $380).",
            "days_ago": 12,
            "topic": "Special Promotions",
            "sub_topic": "New Patient Package",
            "content_type": "Promotion",
            "cta": "Book Online",
            "cta_url": "https://maps.google.com/new-patient-special",
            "promotions": "$149 new patient package with digital xrays and cleaning",
            "keywords": ["wellness package", "cleaning special", "new patient", "x-rays"],
            "images": ["https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop&q=60"]
        },
        # Competitor 3: Midtown Modern
        {
            "comp": c3,
            "content": "🔬 State-of-the-art upgrade: We have added the revolutionary iTero Lumina intraoral scanner to all our treatment operatories! No more messy impression goop. Scan takes under 60 seconds. ⚡",
            "days_ago": 4,
            "topic": "New Technology",
            "sub_topic": "Intraoral Scanner Upgrade",
            "content_type": "Announcement",
            "cta": "Learn More",
            "cta_url": "https://maps.google.com/itero-upgrade",
            "promotions": None,
            "keywords": ["itero scanner", "modern tech", "no impression goop", "comfortable care"],
            "images": ["https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60"]
        },
        {
            "comp": c3,
            "content": "⭐ 'The most thorough, gentle cleaning I have had in NYC in 10 years.' Thank you Marcus for this heartwarming 5-star review! Our team strives to make every visit completely relaxing.",
            "days_ago": 8,
            "topic": "Customer Showcase",
            "sub_topic": "5-Star Review Highlight",
            "content_type": "Case Study",
            "cta": "Read Reviews",
            "cta_url": "https://maps.google.com/reviews",
            "promotions": None,
            "keywords": ["5 star review", "gentle cleaning", "nyc dentist", "patient feedback"],
            "images": ["https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&auto=format&fit=crop&q=60"]
        }
    ]

    for p in raw_posts:
        c = p["comp"]
        p_date = datetime.utcnow() - timedelta(days=p["days_ago"])
        raw_key = f"{c.name.strip()}||{p['content'].strip()}||{p['days_ago']} days ago"
        c_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

        post_record = Post(
            project_id=project1.id,
            competitor_id=c.id,
            business_name=c.name,
            profile_url=c.maps_url,
            post_url=f"{c.maps_url}#update-{c_hash[:8]}",
            content_hash=c_hash,
            content=p["content"],
            post_date=p_date,
            post_date_raw=f"{p['days_ago']} days ago",
            images=p["images"],
            call_to_action=p["cta"],
            cta_url=p["cta_url"],
            topic=p["topic"],
            sub_topic=p["sub_topic"],
            keywords=p["keywords"],
            content_type=p["content_type"],
            promotions=p["promotions"],
            sentiment="Positive",
            ai_analyzed=True,
            ai_analysis_raw={
                "topic": p["topic"],
                "sub_topic": p["sub_topic"],
                "keywords": p["keywords"],
                "content_type": p["content_type"],
                "call_to_action": p["cta"],
                "promotions": p["promotions"],
                "sentiment": "Positive"
            }
        )
        db.add(post_record)

    # Scrape logs
    log1 = ScrapeLog(
        project_id=project1.id,
        competitor_id=c1.id,
        status="success",
        posts_found=3,
        posts_added=3,
        duplicates_skipped=2,
        error_message=None,
        started_at=datetime.utcnow() - timedelta(hours=3, minutes=10),
        completed_at=datetime.utcnow() - timedelta(hours=3),
        log_details=["Navigated to BrightSmile Google profile", "Found 5 raw cards", "Extracted 3 unique updates", "Skipped 2 duplicate hashes"]
    )
    log2 = ScrapeLog(
        project_id=project1.id,
        competitor_id=c2.id,
        status="success",
        posts_found=3,
        posts_added=3,
        duplicates_skipped=1,
        started_at=datetime.utcnow() - timedelta(hours=5, minutes=12),
        completed_at=datetime.utcnow() - timedelta(hours=5),
        log_details=["Navigated to Tribeca Premier", "Updates tab scanned", "Added 3 posts", "Deduplication checked"]
    )
    db.add(log1)
    db.add(log2)

    # Generated content samples
    gen_idea = GeneratedContent(
        project_id=project1.id,
        type="idea",
        topic="Counter-Promotion Strategy",
        title="Beat Competitor Whitening with 'Shade Match Guarantee'",
        content="Competitors are running price-cut discounts on whitening. Differentiate Apex Dental by offering a 'Guaranteed 5-Shade Lift or Free Touchup' promotion.",
        keywords=["shade match guarantee", "teeth whitening", "quality assurance"],
        call_to_action="Book Online",
        image_idea="High-contrast clinical before/after smile shade comparison gauge",
        ai_provider="gemini-1.5-flash",
        competitor_reference="BrightSmile 20% discount post"
    )
    gen_post = GeneratedContent(
        project_id=project1.id,
        type="post",
        topic="Emergency Dentistry",
        title="Post: Same-Day Emergency Relief",
        content="🚨 Sudden tooth pain or broken crown? Don't suffer through your workday. Apex Dental offers reserved same-day priority appointments in Midtown.\n\n✅ Gentle pain relief in under 45 minutes\n✅ In-house 3D digital imaging\n✅ Direct insurance verification\n\nTap Call Now to speak with our on-call coordinator!",
        keywords=["emergency dentist manhattan", "same day appointment", "toothache relief"],
        call_to_action="Call Now",
        image_idea="Warm photo of Apex clinic reception desk with emergency coordinator greeting incoming patient",
        ai_provider="gemini-1.5-flash",
        competitor_reference="Tribeca Premier emergency post"
    )
    db.add(gen_idea)
    db.add(gen_post)

    db.commit()
    return {"status": "seeded_successfully", "projects": 1, "competitors": 4, "posts": 8}

@router.post("")
def trigger_seed(db: Session = Depends(get_db)):
    result = run_db_seed(db)
    return result

@router.post("/reset-and-seed")
def reset_and_seed(db: Session = Depends(get_db)):
    # Clear tables
    db.query(GeneratedContent).delete()
    db.query(ScrapeLog).delete()
    db.query(Post).delete()
    db.query(Competitor).delete()
    db.query(Project).delete()
    db.commit()
    return run_db_seed(db)
