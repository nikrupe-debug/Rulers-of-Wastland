import type { Building, BuildingBonus, BuildingType } from '../types/game';

export const BUILDING_BONUSES: Record<BuildingType, BuildingBonus> = {
  hospital:     { healSpeed: 2 },
  factory:      { equipmentCostReduction: 0.30 },
  bank:         { incomeBonus: 200 },
  research_lab: { researchSpeed: 2 },
  police_hq:    { alertIncrease: 1 },
  nightclub:    { prestigePerTurn: 5 },
  warehouse:    { equipmentSlots: 2 },
  media_tower:  { prestigePerTurn: 10, revealsEnemyPositions: true },
};

export const BUILDING_LABELS: Record<BuildingType, string> = {
  hospital:     'Hospital',
  factory:      'Factory',
  bank:         'Bank',
  research_lab: 'Research Lab',
  police_hq:    'Police HQ',
  nightclub:    'Nightclub',
  warehouse:    'Warehouse',
  media_tower:  'Media Tower',
};

export const BUILDING_DESCRIPTIONS: Record<BuildingType, string> = {
  hospital:     'Gangs heal 2× faster in this sector',
  factory:      'Equipment costs 30% less',
  bank:         '+$200 income per turn',
  research_lab: '+2 research points per turn',
  police_hq:    'Raises alert for ALL players while held',
  nightclub:    '+5 prestige per turn',
  warehouse:    'Hold 2 extra equipment items',
  media_tower:  '+10 prestige/turn · reveals enemy positions',
};

export const BUILDING_ICONS: Record<BuildingType, string> = {
  hospital:     '🏥',
  factory:      '🏭',
  bank:         '🏦',
  research_lab: '🔬',
  police_hq:    '🚔',
  nightclub:    '🎰',
  warehouse:    '🏗️',
  media_tower:  '📺',
};

const ALL_TYPES: BuildingType[] = [
  'hospital', 'factory', 'bank', 'research_lab',
  'police_hq', 'nightclub', 'warehouse', 'media_tower',
];

let _buildingCounter = 0;

export function createBuilding(type: BuildingType): Building {
  return {
    id: `b_${type}_${_buildingCounter++}`,
    type,
    owner: null,
    controlled: false,
    bonus: BUILDING_BONUSES[type],
    controlProgress: 0,
    controllingPlayerId: null,
    extortedBy: [],
  };
}

export function randomBuildingTypes(count: number, seed: number): BuildingType[] {
  const types: BuildingType[] = [];
  for (let i = 0; i < count; i++) {
    types.push(ALL_TYPES[(seed + i * 3) % ALL_TYPES.length]);
  }
  return types;
}
