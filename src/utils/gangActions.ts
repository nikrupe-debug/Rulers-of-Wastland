import type { Gang, Player, CityGrid, GangAction, BuildingType } from '../types/game';
import { BUILDING_LABELS } from '../data/buildings';
import { TECH_TREE } from '../data/techs';
import { getAdjacentPositions } from './grid';

const TERRITORY_THRESHOLD = 10;
export const BRIBE_COST = 150;

export interface ActionItem {
  label: string;
  action: GangAction;
  category: string;
  buildingType?: BuildingType;
  buildingProgress?: number;
  isBurned?: boolean;
}

export const CATEGORIES: { key: string; label: string }[] = [
  { key: 'move',      label: 'Move' },
  { key: 'attack',    label: 'Attack' },
  { key: 'control',   label: 'Control' },
  { key: 'extort',    label: 'Extort' },
  { key: 'research',  label: 'Research' },
  { key: 'utilities', label: 'Utilities' },
];

export function directionLabel(from: [number, number], to: [number, number]): string {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  const v = dr < 0 ? 'North' : dr > 0 ? 'South' : '';
  const h = dc < 0 ? 'West' : dc > 0 ? 'East' : '';
  return `${v}${h}`.trim();
}

export function getGangActions(
  gang: Gang,
  human: Player,
  ai: Player,
  grid: CityGrid,
): ActionItem[] {
  const items: ActionItem[] = [];
  if (!gang.position) return items;
  const pos = gang.position;
  const sector = grid.sectors[pos[0]][pos[1]];

  getAdjacentPositions(pos).forEach(to => {
    items.push({ label: directionLabel(pos, to), action: { type: 'move', target: to }, category: 'move' });
  });

  ai.gangs
    .filter(g => g.status === 'active' && g.position &&
      Math.max(Math.abs(g.position[0] - pos[0]), Math.abs(g.position[1] - pos[1])) <= 1)
    .forEach(enemy => {
      items.push({ label: enemy.name, action: { type: 'attack', targetGangId: enemy.id }, category: 'attack' });
    });

  if (sector.owner !== human.id) {
    items.push({
      label: `Claim Territory  ${sector.controlProgress}/${TERRITORY_THRESHOLD}`,
      action: { type: 'territory', targetSector: pos },
      category: 'control',
    });
  } else {
    sector.buildings.filter(b => b.owner !== human.id).forEach(b => {
      items.push({
        label: BUILDING_LABELS[b.type],
        action: { type: 'control', targetBuildingId: b.id },
        category: 'control',
        buildingType: b.type,
        buildingProgress: b.controlProgress,
        isBurned: b.extortedBy.includes(human.id),
      });
    });
  }

  sector.buildings.filter(b => b.owner !== human.id).forEach(b => {
    items.push({
      label: BUILDING_LABELS[b.type],
      action: { type: 'extort', targetBuildingId: b.id },
      category: 'extort',
      buildingType: b.type,
      isBurned: b.extortedBy.includes(human.id),
    });
  });

  TECH_TREE.filter(t => !human.unlockedTechs.includes(t.id)).forEach(t => {
    items.push({
      label: `${t.name}  ${human.researchProgress[t.id] ?? 0}/${t.cost}`,
      action: { type: 'research', techId: t.id },
      category: 'research',
    });
  });

  if (gang.morale < gang.maxMorale)
    items.push({ label: 'Heal', action: { type: 'heal' }, category: 'utilities' });
  items.push({ label: 'Hide  −1 Alert', action: { type: 'hide' }, category: 'utilities' });
  if (human.cash >= BRIBE_COST)
    items.push({ label: `Bribe  $${BRIBE_COST} · −2 Alert`, action: { type: 'bribe' }, category: 'utilities' });

  return items;
}
