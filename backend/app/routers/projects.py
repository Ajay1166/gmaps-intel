from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Project, Competitor, Post
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    res = []
    for p in projects:
        comp_count = db.query(Competitor).filter(Competitor.project_id == p.id).count()
        post_count = db.query(Post).filter(Post.project_id == p.id).count()
        resp = ProjectResponse.from_orm(p)
        resp.competitor_count = comp_count
        resp.post_count = post_count
        res.append(resp)
    return res

@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=data.name,
        description=data.description,
        business_name=data.business_name,
        business_profile_url=data.business_profile_url,
        business_keywords=data.business_keywords or [],
        industry=data.industry or "General",
        location=data.location
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    resp = ProjectResponse.from_orm(project)
    resp.competitor_count = 0
    resp.post_count = 0
    return resp

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    comp_count = db.query(Competitor).filter(Competitor.project_id == project.id).count()
    post_count = db.query(Post).filter(Post.project_id == project.id).count()
    resp = ProjectResponse.from_orm(project)
    resp.competitor_count = comp_count
    resp.post_count = post_count
    return resp

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = data.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)
    
    db.commit()
    db.refresh(project)
    comp_count = db.query(Competitor).filter(Competitor.project_id == project.id).count()
    post_count = db.query(Post).filter(Post.project_id == project.id).count()
    resp = ProjectResponse.from_orm(project)
    resp.competitor_count = comp_count
    resp.post_count = post_count
    return resp

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"success": True, "message": f"Project {project_id} and all related data deleted successfully"}
