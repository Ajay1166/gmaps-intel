from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Project, Competitor, Post, ScrapeLog, GeneratedContent
from app.schemas import DashboardStatsResponse, PostResponse, ScrapeLogResponse

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_metrics(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    # Total counts
    proj_q = db.query(Project)
    comp_q = db.query(Competitor)
    post_q = db.query(Post)
    log_q = db.query(ScrapeLog)
    gen_q = db.query(GeneratedContent)

    if project_id:
        proj_q = proj_q.filter(Project.id == project_id)
        comp_q = comp_q.filter(Competitor.project_id == project_id)
        post_q = post_q.filter(Post.project_id == project_id)
        log_q = log_q.filter(ScrapeLog.project_id == project_id)
        gen_q = gen_q.filter(GeneratedContent.project_id == project_id)

    total_projects = proj_q.count()
    total_competitors = comp_q.count()
    total_posts = post_q.count()

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_posts = post_q.filter(Post.created_at >= seven_days_ago).count()

    # Sum duplicate posts skipped across scrape logs
    duplicates_sum = log_q.with_entities(func.coalesce(func.sum(ScrapeLog.duplicates_skipped), 0)).scalar()
    failed_scrapes = log_q.filter(ScrapeLog.status == "failure").count()
    generated_count = gen_q.count()

    # Top Topics
    topic_rows = (
        post_q.with_entities(Post.topic, func.count(Post.id).label("count"))
        .group_by(Post.topic)
        .order_by(desc("count"))
        .limit(8)
        .all()
    )
    top_topics = []
    for r in topic_rows:
        pct = round((r.count / total_posts * 100), 1) if total_posts > 0 else 0
        top_topics.append({"topic": r.topic or "Uncategorized", "count": r.count, "percentage": pct})

    # Content Types
    type_rows = (
        post_q.with_entities(Post.content_type, func.count(Post.id).label("count"))
        .group_by(Post.content_type)
        .order_by(desc("count"))
        .all()
    )
    content_types = [{"type": r.content_type or "General", "count": r.count} for r in type_rows]

    # Top Keywords
    all_posts = post_q.with_entities(Post.keywords).all()
    kw_freq: Dict[str, int] = {}
    for p in all_posts:
        if p.keywords and isinstance(p.keywords, list):
            for k in p.keywords:
                k_clean = k.strip().lower()
                if len(k_clean) > 2:
                    kw_freq[k_clean] = kw_freq.get(k_clean, 0) + 1
    
    sorted_kws = sorted(kw_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    top_keywords = [{"keyword": k, "count": v} for k, v in sorted_kws]

    # Recent posts
    recent_p = post_q.order_by(desc(Post.created_at)).limit(6).all()
    recent_posts = [PostResponse.from_orm(p) for p in recent_p]

    # Recent logs
    recent_l = log_q.order_by(desc(ScrapeLog.started_at)).limit(5).all()
    recent_logs = []
    for l in recent_l:
        c_name = None
        if l.competitor_id:
            c = db.query(Competitor).filter(Competitor.id == l.competitor_id).first()
            if c:
                c_name = c.name
        recent_logs.append(ScrapeLogResponse(
            id=l.id,
            project_id=l.project_id,
            competitor_id=l.competitor_id,
            competitor_name=c_name,
            status=l.status,
            posts_found=l.posts_found,
            posts_added=l.posts_added,
            duplicates_skipped=l.duplicates_skipped,
            error_message=l.error_message,
            started_at=l.started_at,
            completed_at=l.completed_at,
            log_details=l.log_details or []
        ))

    return DashboardStatsResponse(
        total_projects=total_projects,
        total_competitors=total_competitors,
        total_posts=total_posts,
        new_posts_last_7_days=new_posts,
        duplicates_skipped=int(duplicates_sum or 0),
        failed_scrapes=failed_scrapes,
        generated_content_count=generated_count,
        top_keywords=top_keywords,
        top_topics=top_topics,
        content_types=content_types,
        recent_posts=recent_posts,
        recent_logs=recent_logs
    )

@router.get("/competitor-trends")
def get_competitor_trends(project_id: int, db: Session = Depends(get_db)):
    """Provides breakdown of posts per competitor and their top themes"""
    competitors = db.query(Competitor).filter(Competitor.project_id == project_id).all()
    trends = []

    for c in competitors:
        posts = db.query(Post).filter(Post.competitor_id == c.id).all()
        # count topics
        t_counts: Dict[str, int] = {}
        for p in posts:
            t = p.topic or "General"
            t_counts[t] = t_counts.get(t, 0) + 1
        
        top_topic = max(t_counts.items(), key=lambda x: x[1])[0] if t_counts else "None"
        promos_count = sum(1 for p in posts if p.promotions)

        trends.append({
            "competitor_id": c.id,
            "competitor_name": c.name,
            "rating": c.rating or 4.5,
            "reviews_count": c.reviews_count or 0,
            "total_posts": len(posts),
            "top_topic": top_topic,
            "promotions_count": promos_count,
            "last_active": c.last_scraped_at
        })

    return {"trends": trends}
