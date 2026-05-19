import type { Player, Gang, GameState, GangAction, AIDifficulty } from '../types/game';
import { getAdjacentPositions, distance } from '../utils/grid';
import { pick } from '../utils/dice';

const WEIGHTS: Record<AIDifficulty, {
  aggression: number; expansion: number; economy: number; stealth: number;
}> = {
  easy:   { aggression: 0.2, expansion: 0.5, economy: 0.7, stealth: 0.1 },
  medium: { aggression: 0.5, expansion: 0.6, economy: 0.5, stealth: 0.3 },
  hard:   { aggression: 0.7, expansion: 0.8, economy: 0.6, stealth: 0.5 },
};

export function pickAIActions(
  aiPlayer: Player,
  state: GameState,
): Gang[] {
  const difficulty = aiPlayer.aiDifficulty ?? 'medium';
  const w = WEIGHTS[difficulty];
  const human = state.players.find(p => p.isHuman)!;

  return aiPlayer.gangs
    .filter(g => g.status === 'active' && g.position !== null)
    .map(gang => {
      const action = chooseAction(gang, aiPlayer, human, state, w);
      return { ...gang, currentAction: action };
    });
}

function chooseAction(
  gang: Gang,
  ai: Player,
  human: Player,
  state: GameState,
  w: { aggression: number; expansion: number; economy: number; stealth: number },
): GangAction {
  const pos = gang.position!;

  // Heal if low morale
  if (gang.morale < gang.maxMorale * 0.3) {
    return { type: 'heal' };
  }

  const sector = state.grid.sectors[pos[0]][pos[1]];

  // Score possible actions
  const scores: { action: GangAction; score: number }[] = [];

  // Claim territory first, then control buildings
  if (sector.owner !== ai.id) {
    scores.push({
      action: { type: 'territory', targetSector: pos },
      score: w.expansion * gang.control * 1.5,
    });
  } else {
    const uncontrolledBuilding = sector.buildings.find(b => b.owner !== ai.id);
    if (uncontrolledBuilding) {
      scores.push({
        action: { type: 'control', targetBuildingId: uncontrolledBuilding.id },
        score: w.expansion * gang.control + (uncontrolledBuilding.type === 'bank' ? w.economy * 2 : 0),
      });
    }
  }

  // Attack a human gang in same sector
  const humanGangsHere = human.gangs.filter(g =>
    g.status === 'active' &&
    g.position?.[0] === pos[0] &&
    g.position?.[1] === pos[1]
  );
  if (humanGangsHere.length > 0) {
    scores.push({
      action: { type: 'attack', targetGangId: pick(humanGangsHere).id },
      score: w.aggression * gang.combat,
    });
  }

  // Move toward human HQ or nearest human gang
  const adjacent = getAdjacentPositions(pos);
  if (adjacent.length > 0) {
    const target = human.gangs.find(g => g.status === 'active' && g.position)?.position
      ?? human.hqSector;
    const best = adjacent.reduce((a, b) =>
      distance(a, target) < distance(b, target) ? a : b
    );
    scores.push({
      action: { type: 'move', target: best },
      score: w.aggression * 0.5 + w.expansion * 0.3,
    });
  }

  // Fallback: move toward human HQ
  if (scores.length === 0) {
    const adj = getAdjacentPositions(pos);
    return { type: 'move', target: pick(adj.length ? adj : [pos]) };
  }

  // Pick highest scoring action (with small random variance for easy)
  const variance = w.aggression < 0.4 ? Math.random() * 0.3 : 0;
  scores.sort((a, b) => (b.score + variance) - a.score);
  return scores[0].action;
}
