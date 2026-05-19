import type { GameState, Player, LogEntry } from '../types/game';
import { resolveMelee } from './combat';
import { pickAIActions } from './ai';
import { checkVictory } from './victory';
import { isAdjacent } from '../utils/grid';
import { d6, pick } from '../utils/dice';
import { TECH_TREE } from '../data/techs';

const TERRITORY_THRESHOLD = 10;
const CONTROL_THRESHOLD = 10;
const BASE_INCOME = 100;
const HEAL_RATE = 2;
const EXTORT_THRESHOLD = 8;
const EXTORT_PAYOUT = 100;
const BRIBE_COST = 150;
const BRIBE_ALERT_REDUCTION = 2;

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

  // Step 3b: Process TERRITORY actions (claim sectors)
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'territory') continue;
      if (!gang.position) continue;
      const sector = grid.sectors[gang.position[0]][gang.position[1]];
      if (sector.owner === player.id) continue;

      if (sector.controllingPlayerId && sector.controllingPlayerId !== player.id) {
        sector.controlProgress = 0;
      }
      sector.controllingPlayerId = player.id;
      sector.controlProgress = Math.min(TERRITORY_THRESHOLD, sector.controlProgress + gang.control);

      if (sector.controlProgress >= TERRITORY_THRESHOLD) {
        const prevOwner = sector.owner;
        sector.owner = player.id;
        sector.controlProgress = 0;
        sector.controllingPlayerId = null;
        // Enemy buildings revert to neutral when territory changes hands
        for (const building of sector.buildings) {
          if (building.owner !== player.id) {
            building.owner = null;
            building.controlled = false;
            building.controlProgress = 0;
            building.controllingPlayerId = null;
          }
        }
        log.push({
          message: `${gang.name} claims sector [${gang.position}]${prevOwner ? ` from ${players.find(p => p.id === prevOwner)?.name}` : ''}!`,
          type: 'control',
        });
        if (prevOwner && prevOwner !== player.id) alertDelta += 1;
      } else {
        log.push({
          message: `${gang.name} contests [${gang.position}] (${sector.controlProgress}/${TERRITORY_THRESHOLD})`,
          type: 'control',
        });
      }
    }
  }

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
      if (sector.owner !== player.id) continue; // must claim territory first
      const building = sector.buildings.find(b => b.id === buildingId);
      if (!building || building.owner === player.id) continue;

      // Reset if a different player was controlling
      if (building.controllingPlayerId && building.controllingPlayerId !== player.id) {
        building.controlProgress = 0;
      }
      building.controllingPlayerId = player.id;
      // Extorted buildings resist control attempts — half contribution
      const controlContrib = building.extortedBy.includes(player.id)
        ? Math.max(1, Math.floor(gang.control / 2))
        : gang.control;
      building.controlProgress = Math.min(CONTROL_THRESHOLD, building.controlProgress + controlContrib);

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

  // Step 5b: Process EXTORT actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'extort') continue;
      const buildingId = gang.currentAction.targetBuildingId;
      if (!gang.position) continue;
      const sector = grid.sectors[gang.position[0]][gang.position[1]];
      const building = sector.buildings.find(b => b.id === buildingId);
      if (!building || building.owner === player.id) continue;

      if (gang.stealth + d6() >= EXTORT_THRESHOLD) {
        player.cash += EXTORT_PAYOUT;
        if (!building.extortedBy.includes(player.id)) {
          building.extortedBy = [...building.extortedBy, player.id];
        }
        log.push({ message: `${gang.name} extorts ${building.type.replace('_', ' ')} — +$${EXTORT_PAYOUT}`, type: 'economy' });
      } else {
        alertDelta += 2;
        log.push({ message: `${gang.name}'s extortion discovered! Alert +2`, type: 'combat' });
      }
    }
  }

  // Step 5c: Process RESEARCH actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'research') continue;
      const techId = gang.currentAction.techId;
      const tech = TECH_TREE.find(t => t.id === techId);
      if (!tech || player.unlockedTechs.includes(techId)) continue;

      player.researchProgress = { ...player.researchProgress };
      player.researchProgress[techId] = (player.researchProgress[techId] ?? 0) + gang.research;

      if (player.researchProgress[techId] >= tech.cost) {
        player.unlockedTechs = [...player.unlockedTechs, techId];
        delete player.researchProgress[techId];
        log.push({ message: `${player.name} unlocked ${tech.name}!`, type: 'research' });
      } else {
        log.push({ message: `${gang.name} researches ${tech.name} (${player.researchProgress[techId]}/${tech.cost})`, type: 'research' });
      }
    }
  }

  // Step 5d: Process BRIBE actions (one per player per turn, first gang with bribe wins)
  for (const player of players) {
    const bribingGang = player.gangs.find(g => g.currentAction?.type === 'bribe' && g.status === 'active');
    if (bribingGang && player.cash >= BRIBE_COST) {
      player.cash -= BRIBE_COST;
      alertDelta -= BRIBE_ALERT_REDUCTION;
      log.push({ message: `${player.name} bribes the authorities — Alert −${BRIBE_ALERT_REDUCTION}`, type: 'system' });
    }
  }

  // Step 6: Process HEAL actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.currentAction?.type !== 'heal') continue;
      if (gang.status === 'dead') continue;
      const healSector = gang.position ? grid.sectors[gang.position[0]][gang.position[1]] : null;
      const hasHospital = healSector?.buildings.some(b => b.type === 'hospital' && b.owner === player.id) ?? false;
      const healRate = hasHospital ? HEAL_RATE * 2 : HEAL_RATE;
      const healed = Math.min(gang.maxMorale - gang.morale, healRate);
      gang.morale += healed;
      gang.status = 'active';
      if (healed > 0) log.push({ message: `${gang.name} recovers ${healed} morale${hasHospital ? ' (hospital)' : ''}`, type: 'event' });
    }
  }

  // Step 7: Process HIDE actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.currentAction?.type === 'hide' && gang.status === 'active') {
        gang.status = 'hiding';
        alertDelta -= 1;
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
    const activeGangs = player.gangs.filter(g => g.status !== 'dead');
    const maintenance = activeGangs.reduce((sum, g) => sum + g.maintenanceCost, 0);

    player.cash += income - maintenance;
    log.push({ message: `${player.name}: +$${income} income, -$${maintenance} upkeep`, type: 'economy' });

    // Desertion — fire most expensive gangs until solvent
    if (player.cash < 0) {
      const sorted = [...activeGangs].sort((a, b) => b.maintenanceCost - a.maintenanceCost);
      while (player.cash < 0 && sorted.length > 0) {
        const deserter = sorted.shift()!;
        const idx = player.gangs.findIndex(g => g.id === deserter.id);
        if (idx >= 0) player.gangs[idx].status = 'dead';
        player.cash += deserter.maintenanceCost;
        log.push({ message: `${deserter.name} deserts ${player.name} — can't make payroll!`, type: 'economy' });
      }
      if (player.cash < 0) player.cash = 0;
    }
  }

  // Police HQ: any owned police_hq raises alert globally each turn
  for (const row of grid.sectors) {
    for (const sector of row) {
      for (const building of sector.buildings) {
        if (building.type === 'police_hq' && building.owner !== null) {
          alertDelta += 1;
        }
      }
    }
  }

  // Step 8b: Police alert effects (based on alert level at TURN START)
  const currentAlert = state.alertSystem.level as number;

  if (currentAlert >= 5) {
    // Crackdown — police hit top 2 players simultaneously
    const withGangs = players.filter(p => p.gangs.some(g => g.status === 'active'));
    for (const player of withGangs) {
      const target = player.gangs.filter(g => g.status === 'active').sort((a, b) => b.morale - a.morale)[0];
      if (target) {
        target.morale = Math.max(0, target.morale - 3);
        if (target.morale <= 0) target.status = 'dead';
        log.push({ message: `CRACKDOWN: ${player.name}'s ${target.name} hit for 3 by police!`, type: 'system' });
      }
    }
  } else if (currentAlert === 4) {
    // Squad — targets most wanted player (most attack/extort actions this turn)
    const heat = (p: typeof players[0]) =>
      p.gangs.filter(g => g.currentAction?.type === 'attack' || g.currentAction?.type === 'extort').length;
    const mostWanted = players.slice().sort((a, b) => heat(b) - heat(a))[0];
    const target = mostWanted.gangs.filter(g => g.status === 'active').sort((a, b) => b.morale - a.morale)[0];
    if (target) {
      target.morale = Math.max(0, target.morale - 2);
      if (target.morale <= 0) target.status = 'dead';
      log.push({ message: `POLICE SQUAD raids ${mostWanted.name} — ${target.name} hit for 2!`, type: 'system' });
      alertDelta += 1;
    }
  } else if (currentAlert >= 2) {
    // Patrol — random sector, stealth check (d6 > stealth → caught, -1 morale)
    const occupied: [number, number][] = [];
    for (let r = 0; r < grid.sectors.length; r++)
      for (let c = 0; c < grid.sectors[r].length; c++)
        if (grid.sectors[r][c].gangsPresent.length > 0) occupied.push([r, c]);

    const patrolChance = currentAlert === 3 ? 0.6 : 0.4;
    if (occupied.length > 0 && Math.random() < patrolChance) {
      const [pr, pc] = pick(occupied);
      for (const player of players) {
        for (const gang of player.gangs) {
          if (gang.status !== 'active' || !gang.position) continue;
          if (gang.position[0] !== pr || gang.position[1] !== pc) continue;
          if (d6() > gang.stealth) {
            gang.morale = Math.max(0, gang.morale - 1);
            if (gang.morale <= 0) gang.status = 'dead';
            log.push({ message: `Police patrol spots ${gang.name} at [${pr},${pc}]! -1 morale`, type: 'system' });
          }
        }
      }
    }
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
        buildings: sector.buildings.map(b => ({ ...b, extortedBy: [...b.extortedBy] })),
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
