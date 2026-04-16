"""Inspection route use-cases."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.errors import AppException
from app.domain.models.route import Checkpoint, CheckpointChecklistItem, InspectionRoute
from app.domain.schemas.routes import (
    CheckpointDto,
    ChecklistItemDto,
    RouteCreateRequest,
    RouteDto,
    RouteUpdateRequest,
)
from app.repositories.equipment_repo import EquipmentRepository
from app.repositories.route_repo import RouteRepository


class RouteService:
    """Route graph orchestration."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._routes = RouteRepository(session)
        self._equipment = EquipmentRepository(session)

    def _to_dto(self, route: InspectionRoute) -> RouteDto:
        """Map ORM route to API DTO."""

        checkpoints_sorted = sorted(route.checkpoints, key=lambda c: c.sort_order)
        checkpoint_dtos: list[CheckpointDto] = []
        for cp in checkpoints_sorted:
            items_sorted = sorted(cp.checklist_items, key=lambda i: i.sort_order)
            checkpoint_dtos.append(
                CheckpointDto(
                    id=cp.id,
                    equipment_id=cp.equipment_id,
                    checklist=[
                        ChecklistItemDto(
                            id=i.id,
                            label=i.label,
                            type=i.type,  # type: ignore[arg-type]
                            required=i.required,
                        )
                        for i in items_sorted
                    ],
                ),
            )
        return RouteDto(id=route.id, name=route.name, checkpoints=checkpoint_dtos)

    async def list_routes(self) -> list[RouteDto]:
        """Return all routes."""

        rows = await self._routes.list_all()
        return [self._to_dto(r) for r in rows]

    async def get_route(self, route_id: str) -> RouteDto:
        """Return a single route or 404."""

        route = await self._routes.get_by_id(route_id)
        if route is None:
            raise AppException(404, "Route not found")
        return self._to_dto(route)

    async def _ensure_equipment(self, equipment_id: str) -> None:
        row = await self._equipment.get_by_id(equipment_id)
        if row is None:
            raise AppException(400, f"Unknown equipment: {equipment_id}")

    async def create_route(self, body: RouteCreateRequest) -> RouteDto:
        """Create a route with nested checkpoints."""

        existing = await self._routes.get_by_id(body.id)
        if existing is not None:
            raise AppException(409, "Route id already exists")

        for cp in body.checkpoints:
            await self._ensure_equipment(cp.equipment_id)

        route = InspectionRoute(id=body.id, name=body.name)
        for cp_order, cp in enumerate(body.checkpoints):
            checkpoint = Checkpoint(
                id=cp.id,
                route=route,
                equipment_id=cp.equipment_id,
                sort_order=cp_order,
            )
            for item_order, item in enumerate(cp.checklist):
                checkpoint.checklist_items.append(
                    CheckpointChecklistItem(
                        id=item.id,
                        label=item.label,
                        type=item.type,
                        required=item.required,
                        sort_order=item_order,
                    ),
                )
            route.checkpoints.append(checkpoint)

        self._session.add(route)
        await self._session.commit()
        await self._session.refresh(route)
        return self._to_dto(route)

    async def update_route(self, route_id: str, body: RouteUpdateRequest) -> RouteDto:
        """Replace route content."""

        route = await self._routes.get_by_id(route_id)
        if route is None:
            raise AppException(404, "Route not found")

        for cp in body.checkpoints:
            await self._ensure_equipment(cp.equipment_id)

        route.name = body.name
        route.checkpoints.clear()
        for cp_order, cp in enumerate(body.checkpoints):
            checkpoint = Checkpoint(
                id=cp.id,
                route=route,
                equipment_id=cp.equipment_id,
                sort_order=cp_order,
            )
            for item_order, item in enumerate(cp.checklist):
                checkpoint.checklist_items.append(
                    CheckpointChecklistItem(
                        id=item.id,
                        label=item.label,
                        type=item.type,
                        required=item.required,
                        sort_order=item_order,
                    ),
                )
            route.checkpoints.append(checkpoint)

        await self._session.commit()
        await self._session.refresh(route)
        return self._to_dto(route)

    async def delete_route(self, route_id: str) -> None:
        """Delete route."""

        route = await self._routes.get_by_id(route_id)
        if route is None:
            raise AppException(404, "Route not found")
        await self._routes.delete(route)
        await self._session.commit()
