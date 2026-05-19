import { create } from 'zustand';
import type {
  GameState, Player, Gang, Sector, CityGrid,
  GangAction, LogEntry, Phase, AIDifficulty, AlertLevel,
} from '../types/game';
import { GANG_ROSTER, createGangInstance } from '../data/gangs';
import { createBuilding, randomBuildingTypes } from '../data/buildings';

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
        owner: null,
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
    gangs: [],
    hqSector: [0, 0],
    color: '#e8a020',
    unlockedTechs: [],
    researchProgress: {},
  };
  const ai: Player = {
    id: 'player_ai',
    name: 'The Overlord',
    isHuman: false,
    aiDifficulty: difficulty,
    cash: 500,
    prestige: 0,
    gangs: [],
    hqSector: [7, 7],
    color: '#cc3333',
    unlockedTechs: [],
    researchProgress: {},
  };
  return [human, ai];
}

function pickAvailableGangs(): Gang[] {
  const shuffled = [...GANG_ROSTER].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((t, i) =>
    createGangInstance(t, 'recruit_pool', i)
  );
}

// ── Store types ───────────────────────────────────────────────────────────────

interface GameStore extends GameState {
  // Setup
  initGame: (humanName: string, difficulty: AIDifficulty) => void;

  // Phase control
  setPhase: (phase: Phase) => void;
  endTurn: () => void;

  // Gang actions
  assignAction: (gangId: string, action: GangAction) => void;
  recruitGang: (gangId: string, playerId: string) => void;

  // Log
  addLog: (entry: Omit<LogEntry, 'turn'>) => void;

  // Alert
  raiseAlert: (amount: number, trigger: string) => void;
  lowerAlert: (amount: number) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, _get) => ({
  // Initial state — pre-game
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

  initGame: (humanName, difficulty) => {
    const grid = buildGrid();
    const [human, ai] = buildInitialPlayers(humanName, difficulty);

    // Mark HQ sectors
    grid.sectors[0][0].owner = human.id;
    grid.sectors[7][7].owner = ai.id;

    set({
      turn: 1,
      phase: 'recruit',
      players: [human, ai],
      currentPlayerIndex: 0,
      grid,
      availableGangs: pickAvailableGangs(),
      eventLog: [{
        turn: 1,
        message: 'The wasteland awaits. Make your first move, Overlord.',
        type: 'system',
      }],
      winner: null,
      alertSystem: { level: 0 as AlertLevel, triggers: [] },
    });
  },

  // ── Phase control ────────────────────────────────────────────────────────

  setPhase: (phase) => set({ phase }),

  endTurn: () => set((state) => ({
    turn: state.turn + 1,
    phase: 'recruit',
    availableGangs: pickAvailableGangs(),
  })),

  // ── Gang management ──────────────────────────────────────────────────────

  assignAction: (gangId, action) => set((state) => {
    const players = state.players.map(p => ({
      ...p,
      gangs: p.gangs.map(g =>
        g.id === gangId ? { ...g, currentAction: action } : g
      ),
    }));
    return { players };
  }),

  recruitGang: (gangId, playerId) => set((state) => {
    const gang = state.availableGangs.find(g => g.id === gangId);
    if (!gang) return state;

    const players = state.players.map(p => {
      if (p.id !== playerId) return p;
      if (p.cash < gang.hiringCost) return p;
      return {
        ...p,
        cash: p.cash - gang.hiringCost,
        gangs: [...p.gangs, { ...gang, position: p.hqSector }],
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
