import type { Building, BuildingBonus, BuildingType } from '../types/game';

export const BUILDING_BONUSES: Record<BuildingType, BuildingBonus> = {
  residency:            { incomeBonus: 10, reputationPerTurn: 1 },
  communication_center: { revealsAdjacentTiles: true, reputationPerTurn: 5 },
  casino:               { incomeBonus: 150, reputationPerTurn: 2 },
  altar:                { prayBonus: 5 },
  laboratory:           { researchBonus: 5 },
  weaponry:             { grantEquipmentTier: 1 },
  military_base:        { grantEquipmentTier: 2 },
  police_station:       { reduceWanted: 1 },
  hospital:             { healBonus: 5 },
  taxing_center:        { incomeBonus: 100, reputationPerTurn: -2 },
  market:               { incomeBonus: 75 },
  black_market:         { incomeBonus: 50, increaseWanted: 1 },
  armory:               { attackBonus: 1, defenseBonus: 1 },
};

export const BUILDING_LABELS: Record<BuildingType, string> = {
  residency:            'Residency',
  communication_center: 'Comm Center',
  casino:               'Casino',
  altar:                'Altar',
  laboratory:           'Laboratory',
  weaponry:             'Weaponry',
  military_base:        'Military Base',
  police_station:       'Police Station',
  hospital:             'Hospital',
  taxing_center:        'Taxing Center',
  market:               'Market',
  black_market:         'Black Market',
  armory:               'Armory',
};

export const BUILDING_DESCRIPTIONS: Record<BuildingType, string> = {
  residency:            '+$10 income · +1 reputation/turn',
  communication_center: 'Reveals adjacent sectors · +5 rep/turn · +5 rep per conquest',
  casino:               '+$150 income · +2 reputation/turn',
  altar:                '+5 to Pray action on this tile',
  laboratory:           '+5 research when studying here',
  weaponry:             'Grants T1 equipment on capture',
  military_base:        'Grants T2 equipment on capture',
  police_station:       'Reduces your wanted level by 1/turn',
  hospital:             '+5 HP when healing here',
  taxing_center:        '+$100 income · −2 reputation/turn',
  market:               '+$75 income per turn',
  black_market:         '+$50 income · +1 wanted/turn',
  armory:               '+1 Attack & Defense in combat here',
};

export const BUILDING_ICONS: Record<BuildingType, string> = {
  residency:            '🏘️',
  communication_center: '📡',
  casino:               '🎰',
  altar:                '⛪',
  laboratory:           '🔬',
  weaponry:             '🔫',
  military_base:        '🏛️',
  police_station:       '🚔',
  hospital:             '🏥',
  taxing_center:        '🏦',
  market:               '🏪',
  black_market:         '🕶️',
  armory:               '⚔️',
};

// Residency appears 4× to make it the most common building (~30% of slots)
const ALL_TYPES: BuildingType[] = [
  'residency', 'residency', 'residency', 'residency',
  'communication_center', 'casino',    'altar',         'laboratory',
  'weaponry',             'military_base', 'police_station', 'hospital',
  'taxing_center',        'market',    'black_market',  'armory',
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
    equipmentGranted: false,
  };
}

export function randomBuildingTypes(count: number, seed: number): BuildingType[] {
  const types: BuildingType[] = [];
  for (let i = 0; i < count; i++) {
    types.push(ALL_TYPES[(seed + i * 3) % ALL_TYPES.length]);
  }
  return types;
}
