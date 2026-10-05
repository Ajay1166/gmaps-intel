from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Post, Competitor
from app.schemas import PostResponse

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.get("", response_model=List[PostResponse])
def get_posts(
    project_id: Optional[int] = None,
    competitor_id: Optional[int] = None,
    search: Optional[str] = None,
    topic: Optional[str] = None,
    keyword: Optional[str] = None,
    content_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    if project_id:
        query = query.filter(Post.project_id == project_id)
    if competitor_id:
        query = query.filter(Post.competitor_id == competitor_id)
    if topic and topic.lower() != "all":
        query = query.filter(Post.topic.ilike(f"%{topic}%"))
    if content_type and content_type.lower() != "all":
        query = query.filter(Post.content_type.ilike(f"%{content_type}%"))
    if search:
        search_filter = or_(
            Post.content.ilike(f"%{search}%"),
            Post.business_name.ilike(f"%{search}%"),
            Post.topic.ilike(f"%{search}%"),
            Post.call_to_action.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    if date_from:
        query = query.filter(Post.post_date >= date_from)
    if date_to:
        query = query.filter(Post.post_date <= date_to)

    posts = query.order_by(desc(Post.created_at)).offset(offset).limit(limit).all()
    
    # Optional keyword in-memory match if keywords is json list
    if keyword and keyword.lower() != "all":
        filtered = []
        for p in posts:
            kw_list = [k.lower() for k in (p.keywords or [])]
            if any(keyword.lower() in k for k in kw_list) or keyword.lower() in p.content.lower():
                filtered.append(p)
        return filtered

    return posts

@router.get("/topics/{project_id}")
def get_unique_topics(project_id: int, db: Session = Depends(get_db)):
    rows = db.query(Post.topic).filter(Post.project_id == project_id).distinct().all()
    topics = [r[0] for r in rows if r[0]]
    return {"topics": sorted(topics)}

@router.get("/keywords/{project_id}")
def get_unique_keywords(project_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post.keywords).filter(Post.project_id == project_id).all()
    all_kws = set()
    for p in posts:
        if p.keywords and isinstance(p.keywords, list):
            for k in p.keywords:
                if k and len(k) > 2:
                    all_kws.add(k.strip().lower())
    return {"keywords": sorted(list(all_kws))}

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"success": True, "message": f"Post {post_id} deleted"}
