import type { GameState, Player } from '../types/game';

export function checkVictory(state: GameState): Player | null {
  const { players, grid, victoryCondition } = state;

  if (victoryCondition.type === 'elimination') {
    for (const player of players) {
      const rivals = players.filter(p => p.id !== player.id);
      const allRivalsEliminated = rivals.every(
        r => r.gangs.every(g => g.status === 'dead')
      );
      if (allRivalsEliminated && player.gangs.some(g => g.status !== 'dead')) {
        return player;
      }
    }
  }

  if (victoryCondition.type === 'domination') {
    for (const player of players) {
      const rivals = players.filter(p => p.id !== player.id);
      const allHQsControlled = rivals.every(r => {
        const [row, col] = r.hqSector;
        return grid.sectors[row][col].owner === player.id;
      });
      if (allHQsControlled) {
        return player;
      }
    }
  }

  return null;
}
