"""Aggregate API router (v1)."""

from fastapi import APIRouter

from app.api.routers import (
    auth,
    checklist_templates,
    dashboard,
    equipment,
    planning,
    routes,
    supabase_workers,
    sync,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(routes.router)
api_router.include_router(equipment.router)
api_router.include_router(dashboard.router)
api_router.include_router(checklist_templates.router)
api_router.include_router(sync.router)
api_router.include_router(planning.router)
api_router.include_router(supabase_workers.router)
