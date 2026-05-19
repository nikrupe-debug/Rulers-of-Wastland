import type { GameState, Player } from '../types/game';

const GREED_TARGET    = 50_000;
const PRESTIGE_TARGET = 500;

export function checkVictory(state: GameState): Player | null {
  switch (state.victoryCondition.type) {
    case 'elimination': return checkElimination(state);
    case 'domination':  return checkDomination(state);
    case 'territory':   return checkTerritory(state);
    case 'greed':       return checkGreed(state);
    case 'prestige':    return checkPrestige(state);
    default:            return null;
  }
}

function checkElimination({ players }: GameState): Player | null {
  for (const player of players) {
    const rivals = players.filter(p => p.id !== player.id);
    if (
      rivals.every(r => r.gangs.every(g => g.status === 'dead')) &&
      player.gangs.some(g => g.status !== 'dead')
    ) return player;
  }
  return null;
}

function checkDomination({ players, grid }: GameState): Player | null {
  for (const player of players) {
    const rivals = players.filter(p => p.id !== player.id);
    if (rivals.every(r => grid.sectors[r.hqSector[0]][r.hqSector[1]].owner === player.id)) {
      return player;
    }
  }
  return null;
}

function checkTerritory({ players, grid }: GameState): Player | null {
  const total = grid.sectors.length * grid.sectors[0].length;
  const threshold = Math.ceil(total * 0.6);
  for (const player of players) {
    let owned = 0;
    for (const row of grid.sectors) for (const s of row) if (s.owner === player.id) owned++;
    if (owned >= threshold) return player;
  }
  return null;
}

function checkGreed({ players }: GameState): Player | null {
  for (const player of players) {
    if (player.cash >= GREED_TARGET) return player;
  }
  return null;
}

function checkPrestige({ players }: GameState): Player | null {
  for (const player of players) {
    if (player.prestige >= PRESTIGE_TARGET) return player;
  }
  return null;
}
