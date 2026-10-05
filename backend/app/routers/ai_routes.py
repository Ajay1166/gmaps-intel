from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Post, Project, GeneratedContent
from app.schemas import (
    IdeaGenerationRequest, IdeaGenerationResponse,
    PostGenerationRequest, PostGenerationResponse,
    GapAnalysisResponse
)
from app.ai.analyzer import ai_analyzer
from app.ai.content_generator import content_generator
from app.ai.gap_detector import gap_detector

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

@router.post("/analyze-post/{post_id}")
async def analyze_post_on_demand(
    post_id: int,
    provider: Optional[str] = "gemini",
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    analysis = await ai_analyzer.analyze_post(
        post_content=post.content,
        business_name=post.business_name,
        provider=provider
    )

    # Update post record with enriched AI insights
    post.topic = analysis.get("topic", post.topic)
    post.sub_topic = analysis.get("sub_topic")
    post.keywords = analysis.get("keywords", post.keywords)
    post.content_type = analysis.get("content_type", post.content_type)
    post.call_to_action = analysis.get("call_to_action", post.call_to_action)
    post.promotions = analysis.get("promotions")
    post.sentiment = analysis.get("sentiment", "Neutral")
    post.ai_analyzed = True
    post.ai_analysis_raw = analysis
    db.commit()
    db.refresh(post)

    return {"success": True, "post_id": post.id, "analysis": analysis}

@router.post("/generate-ideas", response_model=IdeaGenerationResponse)
async def generate_ideas(
    data: IdeaGenerationRequest,
    db: Session = Depends(get_db)
):
    res = await content_generator.generate_ideas(
        db=db,
        project_id=data.project_id,
        count=data.count,
        topic_focus=data.topic_focus,
        ai_provider=data.ai_provider
    )
    return res

@router.post("/generate-post", response_model=PostGenerationResponse)
async def generate_post(
    data: PostGenerationRequest,
    db: Session = Depends(get_db)
):
    res = await content_generator.generate_post(
        db=db,
        project_id=data.project_id,
        topic=data.topic,
        tone=data.tone or "Professional yet friendly",
        include_offer=data.include_offer,
        custom_instructions=data.custom_instructions,
        ai_provider=data.ai_provider
    )
    return res

@router.get("/gap-analysis/{project_id}", response_model=GapAnalysisResponse)
def get_gap_analysis(project_id: int, db: Session = Depends(get_db)):
    res = gap_detector.analyze_gaps(db, project_id)
    return res

@router.get("/generated-history/{project_id}")
def get_generated_history(project_id: int, db: Session = Depends(get_db)):
    history = db.query(GeneratedContent).filter(
        GeneratedContent.project_id == project_id
    ).order_by(GeneratedContent.created_at.desc()).limit(30).all()
    return {"history": history}
