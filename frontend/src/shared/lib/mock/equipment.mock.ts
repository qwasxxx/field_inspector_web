import type { Equipment } from '@/entities/equipment/model/types';

export const EQUIPMENT_BY_ID: Record<string, Equipment> = {
  'eq-tr-01': {
    id: 'eq-tr-01',
    name: 'Трансформатор Т-1',
    designation: 'ТМГ-6300/10',
  },
  'eq-tr-02': {
    id: 'eq-tr-02',
    name: 'Трансформатор Т-2',
    designation: 'ТМГ-6300/10',
  },
  'eq-sw-01': {
    id: 'eq-sw-01',
    name: 'Ячейка РУ-10 кВ, секция А',
    designation: 'КРУЭ-10',
  },
};
