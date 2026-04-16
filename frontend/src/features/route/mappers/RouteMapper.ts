import type { ChecklistItem } from '@/entities/checklist/model/types';
import type { Checkpoint, Route } from '@/entities/route/model/types';
import type {
  ChecklistItemDto,
  CheckpointDto,
  RouteDto,
} from '@/shared/lib/mock/routeDtos';

export class RouteMapper {
  static checklistItemToDomain(dto: ChecklistItemDto): ChecklistItem {
    return {
      id: dto.id,
      label: dto.label,
      type: dto.type,
    };
  }

  static checkpointToDomain(dto: CheckpointDto): Checkpoint {
    return {
      id: dto.id,
      equipmentId: dto.equipmentId,
      checklist: dto.checklist.map((c) => RouteMapper.checklistItemToDomain(c)),
    };
  }

  /** DTO из «API» → доменная модель для UI и бизнес-логики */
  static toViewModel(dto: RouteDto): Route {
    return {
      id: dto.id,
      name: dto.name,
      checkpoints: dto.checkpoints.map((cp) =>
        RouteMapper.checkpointToDomain(cp),
      ),
    };
  }

  static listToViewModels(dtos: RouteDto[]): Route[] {
    return dtos.map((d) => RouteMapper.toViewModel(d));
  }
}
