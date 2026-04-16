"""Inspection route routes."""

from fastapi import APIRouter, Depends, status

from app.domain.models.user import User
from app.domain.schemas.routes import RouteCreateRequest, RouteDto, RouteUpdateRequest
from app.shared.dependencies import get_current_user, get_route_service
from app.services.route_service import RouteService

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=list[RouteDto], response_model_by_alias=True)
async def list_routes(
    _: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
) -> list[RouteDto]:
    """List all inspection routes."""

    return await service.list_routes()


@router.get("/{route_id}", response_model=RouteDto, response_model_by_alias=True)
async def get_route(
    route_id: str,
    _: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
) -> RouteDto:
    """Return a single route graph."""

    return await service.get_route(route_id)


@router.post(
    "",
    response_model=RouteDto,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_route(
    body: RouteCreateRequest,
    _: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
) -> RouteDto:
    """Create a route with nested checkpoints."""

    return await service.create_route(body)


@router.put("/{route_id}", response_model=RouteDto, response_model_by_alias=True)
async def update_route(
    route_id: str,
    body: RouteUpdateRequest,
    _: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
) -> RouteDto:
    """Replace route content."""

    return await service.update_route(route_id, body)


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: str,
    _: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
) -> None:
    """Delete a route."""

    await service.delete_route(route_id)
