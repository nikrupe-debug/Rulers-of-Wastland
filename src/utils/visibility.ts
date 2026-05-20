import type { Player, CityGrid } from '../types/game';

export type VisibilityLevel = 'none' | 'presence' | 'full';

function manhattanDist(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function getSectorVisibility(
  sectorPos: [number, number],
  human: Player,
  grid: CityGrid,
): VisibilityLevel {
  // Global reveal: surveillance_net tech or active divine sight
  if (human.unlockedTechs.includes('surveillance_net') || human.divineSightTurns > 0) return 'full';

  // Sight radius: 1 by default, +1 with street_intel
  const sightRadius = human.unlockedTechs.includes('street_intel') ? 2 : 1;

  const activeGangs = human.gangs.filter(g => g.status !== 'dead' && g.position != null);

  // Gang on this exact sector → full visibility
  const gangHere = activeGangs.some(
    g => g.position![0] === sectorPos[0] && g.position![1] === sectorPos[1],
  );
  if (gangHere) return 'full';

  // Owned communication center reveals adjacent tiles
  const commCenterReveals = grid.sectors.flat()
    .filter(s => s.buildings.some(b => b.type === 'communication_center' && b.owner === human.id))
    .some(s => manhattanDist(s.position, sectorPos) <= 1);
  if (commCenterReveals) return 'full';

  // Gang within sight radius → presence
  const withinRange = activeGangs.some(g => manhattanDist(g.position!, sectorPos) <= sightRadius);
  if (withinRange) return 'presence';

  // HQ always shows presence
  if (sectorPos[0] === human.hqSector[0] && sectorPos[1] === human.hqSector[1]) return 'presence';

  return 'none';
}
