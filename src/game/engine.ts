import type { GameState, Gang, Player, LogEntry, AlertLevel } from '../types/game';
import { resolveMelee } from './combat';
import { pickAIActions } from './ai';
import { checkVictory } from './victory';
import { isAdjacent } from '../utils/grid';

const CONTROL_THRESHOLD = 10;
const BASE_INCOME = 100;
const HEAL_RATE = 2;

export interface ResolutionResult {
  players: Player[];
  grid: GameState['grid'];
  log: Omit<LogEntry, 'turn'>[];
  alertDelta: number;
  winner: Player | null;
}

export function resolveFullTurn(state: GameState): ResolutionResult {
  const log: Omit<LogEntry, 'turn'>[] = [];
  let players = state.players.map(p => ({ ...p, gangs: p.gangs.map(g => ({ ...g })) }));
  let grid = deepCloneGrid(state.grid);
  let alertDelta = 0;

  // Step 1: AI picks actions
  const aiPlayer = players.find(p => !p.isHuman)!;
  const aiWithActions = pickAIActions(aiPlayer, { ...state, players });
  players = players.map(p =>
    p.isHuman ? p : { ...p, gangs: aiWithActions }
  );

  // Step 2: Process MOVE actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'move') continue;
      const target = gang.currentAction.target;
      if (gang.position && isAdjacent(gang.position, target)) {
        gang.position = target;
        log.push({ message: `${gang.name} moves to [${target}]`, type: 'event' });
      }
    }
  }

  // Step 3: Sync gangsPresent on grid
  grid = syncGangsPresent(grid, players);

  // Step 4: Process ATTACK actions (melee)
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'attack') continue;
      const targetId = gang.currentAction.targetGangId;
      const targetPlayer = players.find(p => p.gangs.some(g => g.id === targetId));
      if (!targetPlayer) continue;
      const targetGang = targetPlayer.gangs.find(g => g.id === targetId);
      if (!targetGang || targetGang.status !== 'active') continue;
      if (!gang.position || !targetGang.position) continue;
      if (!isAdjacent(gang.position, targetGang.position) &&
          !(gang.position[0] === targetGang.position[0] && gang.position[1] === targetGang.position[1])) continue;

      const result = resolveMelee(gang, targetGang);
      gang.morale = Math.max(0, gang.morale - result.attackerDamage);
      targetGang.morale = Math.max(0, targetGang.morale - result.defenderDamage);
      if (gang.morale <= 0) gang.status = 'dead';
      if (targetGang.morale <= 0) targetGang.status = 'dead';

      log.push({ message: result.log, type: 'combat' });
      alertDelta += 1;

      if (result.defenderEliminated) {
        log.push({ message: `${targetGang.name} eliminated!`, type: 'combat' });
      }
      if (result.attackerEliminated) {
        log.push({ message: `${gang.name} eliminated!`, type: 'combat' });
      }
    }
  }

  // Step 5: Process CONTROL actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'control') continue;
      const buildingId = gang.currentAction.targetBuildingId;
      if (!gang.position) continue;
      const sector = grid.sectors[gang.position[0]][gang.position[1]];
      const building = sector.buildings.find(b => b.id === buildingId);
      if (!building || building.owner === player.id) continue;

      // Reset if a different player was controlling
      if (building.controllingPlayerId && building.controllingPlayerId !== player.id) {
        building.controlProgress = 0;
      }
      building.controllingPlayerId = player.id;
      building.controlProgress = Math.min(CONTROL_THRESHOLD, building.controlProgress + gang.control);

      if (building.controlProgress >= CONTROL_THRESHOLD) {
        const prevOwner = building.owner;
        building.owner = player.id;
        building.controlled = true;
        building.controlProgress = 0;
        building.controllingPlayerId = null;
        // Update sector owner if all buildings controlled by same player
        const allOwned = sector.buildings.every(b => b.owner === player.id);
        if (allOwned) sector.owner = player.id;
        log.push({ message: `${gang.name} seized ${building.type.replace('_', ' ')}${prevOwner ? ` from ${players.find(p=>p.id===prevOwner)?.name}` : ''}!`, type: 'control' });
        if (building.type === 'police_hq') alertDelta += 1;
      } else {
        log.push({ message: `${gang.name} controlling ${building.type.replace('_', ' ')} (${building.controlProgress}/${CONTROL_THRESHOLD})`, type: 'control' });
      }
    }
  }

  // Step 6: Process HEAL actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.currentAction?.type !== 'heal') continue;
      if (gang.status === 'dead') continue;
      const healed = Math.min(gang.maxMorale - gang.morale, HEAL_RATE);
      gang.morale += healed;
      gang.status = 'active';
      if (healed > 0) log.push({ message: `${gang.name} recovers ${healed} morale`, type: 'event' });
    }
  }

  // Step 7: Process HIDE actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.currentAction?.type === 'hide' && gang.status === 'active') {
        gang.status = 'hiding';
        log.push({ message: `${gang.name} goes dark`, type: 'event' });
      }
      // Un-hide if not hiding this turn
      if (gang.status === 'hiding' && gang.currentAction?.type !== 'hide') {
        gang.status = 'active';
      }
    }
  }

  // Step 8: Income + maintenance
  for (const player of players) {
    let income = BASE_INCOME;
    // Building income
    for (const row of grid.sectors) {
      for (const sector of row) {
        for (const building of sector.buildings) {
          if (building.owner === player.id && building.bonus.incomeBonus) {
            income += building.bonus.incomeBonus;
          }
          if (building.owner === player.id && building.bonus.prestigePerTurn) {
            player.prestige += building.bonus.prestigePerTurn;
          }
        }
      }
    }
    // Maintenance
    const maintenance = player.gangs
      .filter(g => g.status !== 'dead')
      .reduce((sum, g) => sum + g.maintenanceCost, 0);

    player.cash += income - maintenance;
    if (player.cash < 0) player.cash = 0;
    log.push({ message: `${player.name}: +$${income} income, -$${maintenance} maintenance`, type: 'economy' });
  }

  // Step 9: Alert — decrease by 1 if no combat happened
  if (alertDelta === 0) alertDelta = -1;

  // Step 10: Clear actions
  players = players.map(p => ({
    ...p,
    gangs: p.gangs.map(g => ({ ...g, currentAction: null })),
  }));

  // Step 11: Sync grid
  grid = syncGangsPresent(grid, players);

  // Step 12: Victory check
  const winner = checkVictory({ ...state, players, grid });

  return { players, grid, log, alertDelta, winner };
}

function deepCloneGrid(grid: GameState['grid']): GameState['grid'] {
  return {
    sectors: grid.sectors.map(row =>
      row.map(sector => ({
        ...sector,
        buildings: sector.buildings.map(b => ({ ...b })),
        gangsPresent: [...sector.gangsPresent],
      }))
    ),
  };
}

function syncGangsPresent(
  grid: GameState['grid'],
  players: Player[],
): GameState['grid'] {
  const updated = deepCloneGrid(grid);
  for (const row of updated.sectors) {
    for (const sector of row) {
      sector.gangsPresent = [];
    }
  }
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'dead' && gang.position) {
        const [r, c] = gang.position;
        updated.sectors[r][c].gangsPresent.push(gang.id);
      }
    }
  }
  return updated;
}
