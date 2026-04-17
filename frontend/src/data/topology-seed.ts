import type { SupabaseClient } from '@supabase/supabase-js';
import type { EquipmentConnectionRow, EquipmentNodeRow, EquipmentReadingRow } from '@/types/topology';

type SeedIds = {
  plantId: string;
  siteId: string;
  workshopEnergyId: string;
  workshopPumpId: string;
  equipmentIds: string[];
};

function buildNodes(ids: SeedIds): Omit<EquipmentNodeRow, 'created_at' | 'updated_at'>[] {
  const [e114, e115, e116, e117, e118] = ids.equipmentIds;
  return [
    {
      id: ids.plantId,
      parent_id: null,
      name: 'РМК — Томинский ГОК',
      code: 'РМК-ТГОК',
      node_type: 'plant',
      equipment_type: null,
      level: 1,
      pos_x: null,
      pos_y: null,
      passport: {},
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: ids.siteId,
      parent_id: ids.plantId,
      name: 'Томинская площадка',
      code: 'ТП-01',
      node_type: 'site',
      equipment_type: null,
      level: 2,
      pos_x: null,
      pos_y: null,
      passport: {},
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: ids.workshopEnergyId,
      parent_id: ids.siteId,
      name: 'Энергоцех №3',
      code: 'ЭЦ-3',
      node_type: 'workshop',
      equipment_type: null,
      level: 3,
      pos_x: null,
      pos_y: null,
      passport: {},
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: ids.workshopPumpId,
      parent_id: ids.siteId,
      name: 'Насосная станция №1',
      code: 'НС-1',
      node_type: 'workshop',
      equipment_type: null,
      level: 3,
      pos_x: null,
      pos_y: null,
      passport: {},
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: e114,
      parent_id: ids.workshopEnergyId,
      name: 'Трансформатор ТМ-630',
      code: 'Э-114',
      node_type: 'equipment',
      equipment_type: 'transformer',
      level: 5,
      pos_x: 80,
      pos_y: 80,
      passport: {
        equipment_type: 'transformer',
        manufacturer: 'ЗАО «ЗЭТО»',
        last_maintenance: '2025-08-12',
        next_maintenance: '2026-08-12',
      },
      param_norms: {
        voltage_l1: { min: 380, max: 420 },
        temperature_oil: { min: 0, max: 85 },
      },
      meta: {},
      is_active: true,
    },
    {
      id: e115,
      parent_id: ids.workshopEnergyId,
      name: 'Распределительный щит РЩ-1',
      code: 'Э-115',
      node_type: 'equipment',
      equipment_type: 'switchboard',
      level: 5,
      pos_x: 280,
      pos_y: 80,
      passport: {
        equipment_type: 'switchboard',
        manufacturer: 'ABB',
      },
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: e116,
      parent_id: ids.workshopEnergyId,
      name: 'Кабельная линия КЛ-10кВ',
      code: 'Э-116',
      node_type: 'equipment',
      equipment_type: 'cable',
      level: 5,
      pos_x: 480,
      pos_y: 80,
      passport: {
        equipment_type: 'cable',
      },
      param_norms: {},
      meta: {},
      is_active: true,
    },
    {
      id: e117,
      parent_id: ids.workshopEnergyId,
      name: 'Насос ЦНС-60',
      code: 'Э-117',
      node_type: 'equipment',
      equipment_type: 'pump',
      level: 5,
      pos_x: 200,
      pos_y: 220,
      passport: {
        equipment_type: 'pump',
      },
      param_norms: {
        pressure_bar: { min: 4.0, max: 6.0 },
        vibration_mm_s: { min: 0, max: 4.5 },
      },
      meta: {},
      is_active: true,
    },
    {
      id: e118,
      parent_id: ids.workshopEnergyId,
      name: 'Вентиляционная установка ВУ-1',
      code: 'Э-118',
      node_type: 'equipment',
      equipment_type: 'fan',
      level: 5,
      pos_x: 400,
      pos_y: 220,
      passport: {
        equipment_type: 'fan',
      },
      param_norms: {},
      meta: {},
      is_active: true,
    },
  ];
}

function buildConnections(
  ids: SeedIds,
): Omit<EquipmentConnectionRow, 'id'>[] {
  const [e114, e115, , e117] = ids.equipmentIds;
  return [
    {
      from_node_id: e114,
      to_node_id: e115,
      connection_type: 'power',
      label: '10кВ',
      workshop_id: ids.workshopEnergyId,
    },
    {
      from_node_id: e115,
      to_node_id: e117,
      connection_type: 'power',
      label: '0.4кВ',
      workshop_id: ids.workshopEnergyId,
    },
  ];
}

function buildReadings(
  equipmentIds: string[],
  codes: string[],
): Omit<EquipmentReadingRow, 'id' | 'recorded_by' | 'inspection_result_id'>[] {
  const rows: Omit<
    EquipmentReadingRow,
    'id' | 'recorded_by' | 'inspection_result_id'
  >[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  equipmentIds.forEach((eqId, idx) => {
    const code = codes[idx] ?? '';
    for (let i = 0; i < 5; i++) {
      const daysAgo = 28 - i * 6;
      const recorded_at = new Date(now - daysAgo * dayMs - i * 3600000).toISOString();
      const isTransformer = code === 'Э-114';
      const isPump = code === 'Э-117';

      const hasDeviation =
        isTransformer && i === 2 && code === 'Э-114';

      const values: Record<string, number> = {};
      if (isTransformer) {
        values.voltage_l1 = 398 + (i % 3) * 2;
        values.temperature_oil = hasDeviation ? 92 : 62 + i * 2;
        values.temperature_winding = 55 + i;
      } else if (isPump) {
        values.pressure_bar = 5.1 + i * 0.05;
        values.vibration_mm_s = 2.1 + i * 0.1;
      } else {
        values.load_percent = 40 + i * 5;
      }

      rows.push({
        equipment_id: eqId,
        recorded_at,
        source: 'manual',
        values,
        has_deviation: hasDeviation,
        deviation_params: hasDeviation ? ['temperature_oil'] : null,
      });
    }
  });

  return rows;
}

export async function seedTopologyDemo(supabase: SupabaseClient): Promise<void> {
  const ids: SeedIds = {
    plantId: crypto.randomUUID(),
    siteId: crypto.randomUUID(),
    workshopEnergyId: crypto.randomUUID(),
    workshopPumpId: crypto.randomUUID(),
    equipmentIds: [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ],
  };

  const now = new Date().toISOString();
  const nodesPayload = buildNodes(ids).map((n) => ({
    ...n,
    passport: n.passport as Record<string, unknown>,
    param_norms: n.param_norms as Record<string, unknown>,
    created_at: now,
    updated_at: now,
  }));

  const { error: nErr } = await supabase.from('equipment_nodes').insert(nodesPayload);
  if (nErr) throw new Error(nErr.message);

  const connPayload = buildConnections(ids).map((c) => ({
    ...c,
    id: crypto.randomUUID(),
  }));
  const { error: cErr } = await supabase.from('equipment_connections').insert(connPayload);
  if (cErr) throw new Error(cErr.message);

  const codes = ['Э-114', 'Э-115', 'Э-116', 'Э-117', 'Э-118'];
  const readingsPayload = buildReadings(ids.equipmentIds, codes).map((r) => ({
    ...r,
    id: crypto.randomUUID(),
    recorded_by: null,
    inspection_result_id: null,
  }));

  const { error: rErr } = await supabase.from('equipment_readings').insert(readingsPayload);
  if (rErr) throw new Error(rErr.message);
}
