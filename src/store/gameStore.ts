import { create } from 'zustand';
import type {
  GameState, Player, Gang, Sector, CityGrid,
  GangAction, LogEntry, Phase, AIDifficulty, AlertLevel, VictoryType, GangTier,
} from '../types/game';
import { GANG_ROSTER, createGangInstance } from '../data/gangs';
import { createBuilding, randomBuildingTypes } from '../data/buildings';
import { getNeighborhoodName } from '../data/neighborhoods';
import { resolveFullTurn } from '../game/engine';

// ── Grid initialisation ──────────────────────────────────────────────────────

function buildGrid(): CityGrid {
  const sectors: Sector[][] = [];
  for (let row = 0; row < 8; row++) {
    sectors[row] = [];
    for (let col = 0; col < 8; col++) {
      const seed = row * 8 + col;
      const buildingTypes = randomBuildingTypes(3, seed);
      sectors[row][col] = {
        position: [row, col],
        name: getNeighborhoodName(row, col),
        owner: null,
        controlProgress: 0,
        controllingPlayerId: null,
        buildings: buildingTypes.map(t => createBuilding(t)),
        gangsPresent: [],
      };
    }
  }
  return { sectors };
}

function buildInitialPlayers(
  humanName: string,
  difficulty: AIDifficulty,
): [Player, Player] {
  const human: Player = {
    id: 'player_human',
    name: humanName,
    isHuman: true,
    cash: 500,
    prestige: 0,
    religion: 0,
    wanted: 0,
    gangs: [],
    hqSector: [0, 0],
    color: '#e8a020',
    unlockedTechs: [],
    researchProgress: {},
    religionGiftsTriggered: [],
    divineSightTurns: 0,
  };
  const aiHQ: [number, number] = [7, 7];
  const ai: Player = {
    id: 'player_ai',
    name: 'The Overlord',
    isHuman: false,
    aiDifficulty: difficulty,
    cash: 500,
    prestige: 0,
    religion: 0,
    wanted: 0,
    gangs: pickAIStartingGangs(difficulty, aiHQ),
    hqSector: aiHQ,
    color: '#cc3333',
    unlockedTechs: [],
    researchProgress: {},
    religionGiftsTriggered: [],
    divineSightTurns: 0,
  };
  return [human, ai];
}

function pickAvailableGangs(reputation: number = 0): Gang[] {
  // Higher reputation unlocks higher-tier gangs in the recruit pool
  const maxTier = Math.min(6, Math.floor(reputation / 20) + 1) as GangTier;
  const pool = GANG_ROSTER.filter(t => t.tier <= maxTier);
  const source = pool.length >= 3 ? pool : GANG_ROSTER;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((t, i) => createGangInstance(t, 'recruit_pool', i));
}

function pickAIStartingGangs(difficulty: AIDifficulty, hqSector: [number, number]): Gang[] {
  const count = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const shuffled = [...GANG_ROSTER].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((t, i) => ({
    ...createGangInstance(t, 'player_ai', i),
    position: hqSector,
  }));
}

// ── Store types ───────────────────────────────────────────────────────────────

interface GameStore extends GameState {
  initGame: (humanName: string, difficulty: AIDifficulty, victoryMode?: VictoryType) => void;
  resetGame: () => void;
  setPhase: (phase: Phase) => void;
  skipRecruit: () => void;
  resolveOrders: () => void;
  assignAction: (gangId: string, action: GangAction) => void;
  recruitGang: (gangId: string, playerId: string, position: [number, number]) => void;
  addLog: (entry: Omit<LogEntry, 'turn'>) => void;
  raiseAlert: (amount: number, trigger: string) => void;
  lowerAlert: (amount: number) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, _get) => ({
  turn: 0,
  phase: 'recruit',
  players: [],
  currentPlayerIndex: 0,
  grid: { sectors: [] },
  availableGangs: [],
  eventLog: [],
  victoryCondition: { type: 'elimination' },
  winner: null,
  alertSystem: { level: 0 as AlertLevel, triggers: [] },

  // ── Setup ────────────────────────────────────────────────────────────────

  resetGame: () => set({ players: [], turn: 0 }),

  initGame: (humanName, difficulty, victoryMode = 'elimination') => {
    const grid = buildGrid();
    const [human, ai] = buildInitialPlayers(humanName, difficulty);

    grid.sectors[0][0].owner = human.id;
    grid.sectors[7][7].owner = ai.id;

    set({
      turn: 1,
      phase: 'recruit',
      players: [human, ai],
      currentPlayerIndex: 0,
      grid,
      availableGangs: pickAvailableGangs(0),
      eventLog: [{
        turn: 1,
        message: 'The wasteland awaits. Make your first move, Overlord.',
        type: 'system',
      }],
      winner: null,
      victoryCondition: { type: victoryMode },
      alertSystem: { level: 0 as AlertLevel, triggers: [] },
    });
  },

  // ── Phase control ────────────────────────────────────────────────────────

  setPhase: (phase) => set({ phase }),

  skipRecruit: () => set({ phase: 'orders' }),

  resolveOrders: () => set((state) => {
    // AI auto-recruits if it has fewer than 2 active gangs and can afford one
    let stateForResolution = state;
    const aiPlayer = state.players.find(p => !p.isHuman);
    if (aiPlayer) {
      const activeCount = aiPlayer.gangs.filter(g => g.status !== 'dead').length;
      if (activeCount < 2 && state.availableGangs.length > 0) {
        const recruit = state.availableGangs.find(g => g.hiringCost <= aiPlayer.cash);
        if (recruit) {
          const newGang: Gang = { ...recruit, position: aiPlayer.hqSector };
          stateForResolution = {
            ...state,
            players: state.players.map(p =>
              !p.isHuman
                ? { ...p, cash: p.cash - recruit.hiringCost, gangs: [...p.gangs, newGang] }
                : p,
            ),
            availableGangs: state.availableGangs.filter(g => g.id !== recruit.id),
          };
        }
      }
    }

    const result = resolveFullTurn(stateForResolution);
    const newAlertRaw = (state.alertSystem.level as number) + result.alertDelta;
    const newAlertLevel = Math.min(5, Math.max(0, newAlertRaw)) as AlertLevel;
    const newEntries: LogEntry[] = result.log.map(e => ({ ...e, turn: state.turn }));
    const humanPlayer = result.players.find(p => p.isHuman);

    return {
      players: result.players,
      grid: result.grid,
      winner: result.winner,
      phase: result.winner ? 'end' : 'recruit',
      turn: result.winner ? state.turn : state.turn + 1,
      availableGangs: result.winner
        ? state.availableGangs
        : pickAvailableGangs(humanPlayer?.prestige ?? 0),
      eventLog: [...newEntries, ...state.eventLog].slice(0, 100),
      alertSystem: { level: newAlertLevel, triggers: [] },
    };
  }),

  // ── Gang management ──────────────────────────────────────────────────────

  assignAction: (gangId, action) => set((state) => {
    const players = state.players.map(p => ({
      ...p,
      gangs: p.gangs.map(g =>
        g.id === gangId ? { ...g, currentAction: action } : g,
      ),
    }));
    return { players };
  }),

  recruitGang: (gangId, playerId, position) => set((state) => {
    const gang = state.availableGangs.find(g => g.id === gangId);
    if (!gang) return state;

    const players = state.players.map(p => {
      if (p.id !== playerId) return p;
      if (p.cash < gang.hiringCost) return p;
      return {
        ...p,
        cash: p.cash - gang.hiringCost,
        gangs: [...p.gangs, { ...gang, position }],
      };
    });
    const availableGangs = state.availableGangs.filter(g => g.id !== gangId);
    return { players, availableGangs };
  }),

  // ── Log ──────────────────────────────────────────────────────────────────

  addLog: (entry) => set((state) => ({
    eventLog: [{ ...entry, turn: state.turn }, ...state.eventLog].slice(0, 100),
  })),

  // ── Alert ────────────────────────────────────────────────────────────────

  raiseAlert: (amount, trigger) => set((state) => {
    const raw = (state.alertSystem.level as number) + amount;
    const level = Math.min(5, raw) as AlertLevel;
    return {
      alertSystem: {
        level,
        triggers: [...state.alertSystem.triggers, trigger],
      },
    };
  }),

  lowerAlert: (amount) => set((state) => {
    const raw = (state.alertSystem.level as number) - amount;
    const level = Math.max(0, raw) as AlertLevel;
    return {
      alertSystem: { ...state.alertSystem, level },
    };
  }),
}));
