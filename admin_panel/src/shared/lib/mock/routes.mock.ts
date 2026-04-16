import type { RouteDto } from '@/shared/lib/mock/routeDtos';

export const ROUTES_MOCK: RouteDto[] = [
  {
    id: 'route-main-transformers',
    name: 'Главный трансформаторный блок',
    checkpoints: [
      {
        id: 'cp-t1',
        equipmentId: 'eq-tr-01',
        checklist: [
          {
            id: 'cl-t1-1',
            label: 'Визуально: нет подтёков масла',
            type: 'boolean',
          },
          {
            id: 'cl-t1-2',
            label: 'Температура верхнего слоя масла, °C',
            type: 'number',
          },
          {
            id: 'cl-t1-3',
            label: 'Комментарий по дефектам',
            type: 'text',
          },
        ],
      },
      {
        id: 'cp-t2',
        equipmentId: 'eq-tr-02',
        checklist: [
          {
            id: 'cl-t2-1',
            label: 'Шум/вибрация в норме',
            type: 'boolean',
          },
          {
            id: 'cl-t2-2',
            label: 'Показание счётчика обходов',
            type: 'number',
          },
        ],
      },
    ],
  },
  {
    id: 'route-switchgear',
    name: 'РУ-10 кВ распределительное',
    checkpoints: [
      {
        id: 'cp-sg1',
        equipmentId: 'eq-sw-01',
        checklist: [
          {
            id: 'cl-sg1-1',
            label: 'Индикация положения разъединителей',
            type: 'boolean',
          },
          {
            id: 'cl-sg1-2',
            label: 'Замечания по изоляторам',
            type: 'text',
          },
        ],
      },
    ],
  },
];
