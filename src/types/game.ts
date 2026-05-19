export type Phase = 'recruit' | 'orders' | 'resolution' | 'end';
export type GangStatus = 'active' | 'hiding' | 'healing' | 'dead';
export type BuildingType =
  | 'hospital' | 'factory' | 'bank' | 'research_lab'
  | 'police_hq' | 'nightclub' | 'warehouse' | 'media_tower';
export type EquipmentType = 'weapon' | 'armor' | 'gadget';
export type VictoryType = 'elimination' | 'domination' | 'territory' | 'greed' | 'prestige';
export type AlertLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type TechTier = 1 | 2 | 3;

export interface BuildingBonus {
  healSpeed?: number;
  equipmentCostReduction?: number;
  incomeBonus?: number;
  researchSpeed?: number;
  alertIncrease?: number;
  prestigePerTurn?: number;
  equipmentSlots?: number;
  revealsEnemyPositions?: boolean;
}

export interface Building {
  id: string;
  type: BuildingType;
  owner: string | null;
  controlled: boolean;
  bonus: BuildingBonus;
  controlProgress: number;       // 0–10
  controllingPlayerId: string | null;
  extortedBy: string[];          // player ids that have extorted this building
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  cost: number;
  bonus: Partial<Pick<Gang, 'combat' | 'ranged' | 'stealth'>>;
  uses: number | 'unlimited';
}

export type GangAction =
  | { type: 'move';    target: [number, number] }
  | { type: 'attack';  targetGangId: string }
  | { type: 'control'; targetBuildingId: string }
  | { type: 'extort';  targetBuildingId: string }
  | { type: 'research'; techId: string }
  | { type: 'equip';   equipmentId: string }
  | { type: 'bribe' }
  | { type: 'hide' }
  | { type: 'heal' };

export interface Gang {
  id: string;
  name: string;
  flavor: string;
  portrait: string;
  position: [number, number] | null;
  combat: number;
  ranged: number;
  stealth: number;
  control: number;
  research: number;
  morale: number;
  maxMorale: number;
  hiringCost: number;
  maintenanceCost: number;
  equipment: Equipment[];
  status: GangStatus;
  currentAction: GangAction | null;
}

export interface Sector {
  position: [number, number];
  owner: string | null;
  buildings: Building[];
  gangsPresent: string[]; // gang ids
}

export interface CityGrid {
  sectors: Sector[][];
}

export interface TechEffect {
  visibilityRadius?: number;
  healSpeedMultiplier?: number;
  extraActions?: number;
  instantControl?: boolean;
  defenseBonus?: number;
  revealEnemies?: boolean;
  statBonus?: number;
  statBonusDuration?: number;
  empRadius?: number;
  incomeSteal?: number;
  stealthBonus?: number;
  stealthDuration?: number;
}

export interface Tech {
  id: string;
  name: string;
  description: string;
  tier: TechTier;
  cost: number;
  effect: TechEffect;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  aiDifficulty?: AIDifficulty;
  cash: number;
  prestige: number;
  gangs: Gang[];
  hqSector: [number, number];
  color: string;
  unlockedTechs: string[];
  researchProgress: Record<string, number>;
}

export interface LogEntry {
  turn: number;
  message: string;
  type: 'combat' | 'control' | 'event' | 'research' | 'economy' | 'system';
}

export interface AlertSystem {
  level: AlertLevel;
  triggers: string[];
}

export interface VictoryCondition {
  type: VictoryType;
}

export interface AIStrategy {
  aggressionWeight: number;
  expansionWeight: number;
  economyWeight: number;
  stealthWeight: number;
}

export interface GameState {
  turn: number;
  phase: Phase;
  players: Player[];
  currentPlayerIndex: number;
  grid: CityGrid;
  availableGangs: Gang[];
  eventLog: LogEntry[];
  victoryCondition: VictoryCondition;
  winner: Player | null;
  alertSystem: AlertSystem;
}
