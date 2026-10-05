from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str = Field(..., example="Downtown Dental Clinic Intel")
    description: Optional[str] = Field(None, example="Competitor intelligence for dental practices in Manhattan")
    business_name: str = Field(..., example="Apex Family & Cosmetic Dental")
    business_profile_url: Optional[str] = Field(None, example="https://maps.google.com/?cid=123456")
    business_keywords: List[str] = Field(default_factory=list, example=["teeth whitening", "invisalign", "emergency dentist"])
    industry: str = Field("General", example="Dental Practice")
    location: Optional[str] = Field(None, example="New York, NY")

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    business_name: Optional[str] = None
    business_profile_url: Optional[str] = None
    business_keywords: Optional[List[str]] = None
    industry: Optional[str] = None
    location: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    competitor_count: int = 0
    post_count: int = 0

    class Config:
        from_attributes = True


# --- Competitor Schemas ---
class CompetitorBase(BaseModel):
    name: str = Field(..., example="BrightSmile Dental Studio")
    maps_url: str = Field(..., example="https://maps.google.com/?cid=987654")
    place_id: Optional[str] = None
    address: Optional[str] = Field(None, example="450 Lexington Ave, New York, NY")
    rating: Optional[float] = Field(None, example=4.8)
    reviews_count: Optional[int] = Field(None, example=342)

class CompetitorCreate(CompetitorBase):
    project_id: int

class CompetitorResponse(CompetitorBase):
    id: int
    project_id: int
    status: str
    last_scraped_at: Optional[datetime] = None
    created_at: datetime
    post_count: int = 0

    class Config:
        from_attributes = True


# --- Post Schemas ---
class PostBase(BaseModel):
    business_name: str
    profile_url: Optional[str] = None
    post_url: Optional[str] = None
    content: str
    post_date_raw: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    call_to_action: Optional[str] = None
    cta_url: Optional[str] = None
    topic: Optional[str] = "General Update"
    sub_topic: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    content_type: Optional[str] = "Announcement"
    promotions: Optional[str] = None
    sentiment: Optional[str] = "Neutral"

class PostCreate(PostBase):
    project_id: int
    competitor_id: int
    post_date: Optional[datetime] = None

class PostResponse(PostBase):
    id: int
    project_id: int
    competitor_id: int
    content_hash: str
    post_date: Optional[datetime] = None
    ai_analyzed: bool
    ai_analysis_raw: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Scrape Log Schemas ---
class ScrapeLogResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    competitor_id: Optional[int] = None
    competitor_name: Optional[str] = None
    status: str
    posts_found: int
    posts_added: int
    duplicates_skipped: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    log_details: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True

class ScrapeTriggerRequest(BaseModel):
    project_id: int
    competitor_ids: Optional[List[int]] = None  # None means all competitors in project
    use_simulation: bool = False  # For demo / fallback or test
    max_posts_per_competitor: int = 15


# --- AI Generation Schemas ---
class IdeaGenerationRequest(BaseModel):
    project_id: int
    competitor_id: Optional[int] = None
    topic_focus: Optional[str] = None
    count: int = Field(5, ge=1, le=50)
    ai_provider: Optional[str] = "gemini"  # "gemini" or "openai"

class IdeaItem(BaseModel):
    topic: str
    title: str
    description: str
    angle: str
    competitor_insight: str
    suggested_call_to_action: str

class IdeaGenerationResponse(BaseModel):
    project_id: int
    ideas: List[IdeaItem]
    ai_provider_used: str

class PostGenerationRequest(BaseModel):
    project_id: int
    topic: str
    tone: Optional[str] = "Professional yet friendly"
    include_offer: bool = False
    custom_instructions: Optional[str] = None
    ai_provider: Optional[str] = "gemini"

class GeneratedPostItem(BaseModel):
    topic: str
    content: str
    keywords: List[str]
    call_to_action: str
    cta_url_suggestion: str
    image_idea: str
    character_count: int

class PostGenerationResponse(BaseModel):
    project_id: int
    post: GeneratedPostItem
    ai_provider_used: str


# --- Gap Analysis Schemas ---
class ContentGapItem(BaseModel):
    topic: str
    competitor_coverage_pct: float
    importance_score: str  # High, Medium, Low
    competitor_examples: List[str]
    suggested_angle_for_our_business: str

class GapAnalysisResponse(BaseModel):
    project_id: int
    business_name: str
    competitor_count: int
    total_competitor_posts: int
    missing_topics: List[ContentGapItem]
    improvement_recommendations: List[str]


# --- Dashboard Stats Schemas ---
class DashboardStatsResponse(BaseModel):
    total_projects: int
    total_competitors: int
    total_posts: int
    new_posts_last_7_days: int
    duplicates_skipped: int
    failed_scrapes: int
    generated_content_count: int
    top_keywords: List[Dict[str, Any]]
    top_topics: List[Dict[str, Any]]
    content_types: List[Dict[str, Any]]
    recent_posts: List[PostResponse]
    recent_logs: List[ScrapeLogResponse]
