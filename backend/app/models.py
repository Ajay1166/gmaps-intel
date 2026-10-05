import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Business profile (our business)
    business_name = Column(String(255), nullable=False)
    business_profile_url = Column(Text, nullable=True)
    business_keywords = Column(JSON, default=list)  # List of target keywords
    industry = Column(String(100), default="General")
    location = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    competitors = relationship("Competitor", back_populates="project", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="project", cascade="all, delete-orphan")
    scrape_logs = relationship("ScrapeLog", back_populates="project", cascade="all, delete-orphan")
    generated_contents = relationship("GeneratedContent", back_populates="project", cascade="all, delete-orphan")


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    maps_url = Column(Text, nullable=False)
    place_id = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    rating = Column(Float, nullable=True)
    reviews_count = Column(Integer, nullable=True)
    
    last_scraped_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="idle")  # idle, scraping, success, failed, captcha
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="competitors")
    posts = relationship("Post", back_populates="competitor", cascade="all, delete-orphan")
    scrape_logs = relationship("ScrapeLog", back_populates="competitor", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    competitor_id = Column(Integer, ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False)
    
    business_name = Column(String(255), nullable=False)
    profile_url = Column(Text, nullable=True)
    post_url = Column(Text, nullable=True, index=True)
    content_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash for duplicate detection
    
    content = Column(Text, nullable=False)
    post_date = Column(DateTime, nullable=True)
    post_date_raw = Column(String(100), nullable=True)  # e.g., "3 days ago", "Oct 12"
    
    images = Column(JSON, default=list)  # list of image URLs
    call_to_action = Column(String(100), nullable=True)  # "Learn More", "Call Now", "Offer", etc.
    cta_url = Column(Text, nullable=True)
    
    # AI Enrichment Fields
    topic = Column(String(100), default="General Update", index=True)
    sub_topic = Column(String(100), nullable=True)
    keywords = Column(JSON, default=list)  # list of extracted keywords
    content_type = Column(String(50), default="Announcement")  # Promotion, Announcement, Event, Product Showcase, Tip/Educational
    promotions = Column(Text, nullable=True)  # Discount or special offer details
    sentiment = Column(String(50), default="Neutral")
    ai_analyzed = Column(Boolean, default=False)
    ai_analysis_raw = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="posts")
    competitor = relationship("Competitor", back_populates="posts")


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id", ondelete="CASCADE"), nullable=True)
    
    status = Column(String(50), nullable=False)  # "success", "failure", "running", "captcha_detected", "paused"
    posts_found = Column(Integer, default=0)
    posts_added = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    log_details = Column(JSON, default=list)  # Detailed timeline events

    # Relationships
    project = relationship("Project", back_populates="scrape_logs")
    competitor = relationship("Competitor", back_populates="scrape_logs")


class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String(50), nullable=False)  # "idea", "post", "gap_analysis"
    topic = Column(String(255), nullable=True)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    keywords = Column(JSON, default=list)
    call_to_action = Column(String(100), nullable=True)
    image_idea = Column(Text, nullable=True)
    ai_provider = Column(String(50), default="gemini")
    competitor_reference = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="generated_contents")
