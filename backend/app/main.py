import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    projects, competitors, posts,
    scraper_routes, analytics, ai_routes, seed
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed sample demo data if database is fresh
    db = SessionLocal()
    try:
        from app.models import Project
        if db.query(Project).count() == 0:
            logger.info("Fresh database detected. Pre-populating realistic demo data...")
            seed.run_db_seed(db)
    except Exception as e:
        logger.warning(f"Auto-seed check: {e}")
    finally:
        db.close()
        
    yield
    logger.info("Shutting down API server...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack intelligence tool for monitoring, analyzing, and out-competing rival Google Maps Business Profile updates.",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev and preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(projects.router)
app.include_router(competitors.router)
app.include_router(posts.router)
app.include_router(scraper_routes.router)
app.include_router(analytics.router)
app.include_router(ai_routes.router)
app.include_router(seed.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "endpoints": {
            "projects": "/api/projects",
            "competitors": "/api/competitors",
            "posts": "/api/posts",
            "analytics": "/api/analytics/dashboard",
            "scraper": "/api/scraper/trigger",
            "ai_generate_ideas": "/api/ai/generate-ideas",
            "ai_generate_post": "/api/ai/generate-post",
            "gap_analysis": "/api/ai/gap-analysis/{project_id}"
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
