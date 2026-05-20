export type Phase = 'recruit' | 'orders' | 'resolution' | 'end';
export type GangStatus = 'active' | 'hiding' | 'healing' | 'dead';
export type GangTier = 1 | 2 | 3 | 4 | 5 | 6;
export type BuildingType =
  | 'communication_center' | 'casino'    | 'altar'         | 'laboratory'
  | 'weaponry'             | 'military_base' | 'police_station' | 'hospital'
  | 'taxing_center'        | 'market'    | 'black_market'  | 'armory';
export type EquipmentType = 'weapon' | 'armor' | 'gadget';
export type VictoryType = 'elimination' | 'domination' | 'territory' | 'greed' | 'prestige';
export type AlertLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type TechTier = 1 | 2 | 3;
export type DivineSKill =
  | 'haste' | 'divine_sight'
  | 'conjure_familiar_base' | 'conjure_familiar_upgraded'
  | 'bless_base' | 'bless_upgraded';

export type GangStatBonus = Partial<{
  attack:   number;
  defense:  number;
  stealth:  number;
  control:  number;
  research: number;
  divine:   number;
}>;

export interface BuildingBonus {
  incomeBonus?:         number;   // global per turn
  reputationPerTurn?:   number;   // ± prestige per turn (casino +, taxing -)
  prayBonus?:           number;   // tile-local: +N when praying
  researchBonus?:       number;   // tile-local: +N when researching
  healBonus?:           number;   // tile-local: +N heal per turn
  attackBonus?:         number;   // tile-local: +N in combat
  defenseBonus?:        number;   // tile-local: +N in combat
  revealsAdjacentTiles?: boolean; // communication center
  grantEquipmentTier?:  number;   // one-time on first capture
  reduceWanted?:        number;   // police station per turn
  increaseWanted?:      number;   // black market per turn
}

export interface Building {
  id: string;
  type: BuildingType;
  owner: string | null;
  controlled: boolean;
  bonus: BuildingBonus;
  controlProgress: number;
  controllingPlayerId: string | null;
  extortedBy: string[];
  equipmentGranted: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  cost: number;
  tier: number;
  bonus: GangStatBonus;
  uses: number | 'unlimited';
}

export type GangAction =
  | { type: 'move';      target: [number, number] }
  | { type: 'attack';    targetGangId: string }
  | { type: 'territory'; targetSector: [number, number] }
  | { type: 'control';   targetBuildingId: string }
  | { type: 'extort';    targetBuildingId: string }
  | { type: 'research';  techId: string }
  | { type: 'equip';     equipmentId: string }
  | { type: 'bribe' }
  | { type: 'hide' }
  | { type: 'heal' }
  | { type: 'pray' };

export interface Gang {
  id: string;
  name: string;
  flavor: string;
  portrait: string;
  position: [number, number] | null;
  attack: number;
  defense: number;
  stealth: number;
  control: number;
  research: number;
  divine: number;
  morale: number;
  maxMorale: number;
  hp: number;
  maxHp: number;
  tier: GangTier;
  divineSkills: DivineSKill[];
  lowHpRounds: number;
  underpaidRounds: number;
  blessBonus: number;
  blessTurns: number;
  hiringCost: number;
  maintenanceCost: number;
  equipment: Equipment[];
  status: GangStatus;
  currentAction: GangAction | null;
}

export interface Sector {
  position: [number, number];
  name: string;
  owner: string | null;
  controlProgress: number;
  controllingPlayerId: string | null;
  buildings: Building[];
  gangsPresent: string[];
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
  religion: number;
  wanted: number;
  gangs: Gang[];
  hqSector: [number, number];
  color: string;
  unlockedTechs: string[];
  researchProgress: Record<string, number>;
  religionGiftsTriggered: number[];
  divineSightTurns: number;
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
