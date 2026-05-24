import type { GameState, Player, LogEntry } from '../types/game';
import { resolveCombat } from './combat';
import { checkAndApplyReligionGifts } from './religion';
import { pickAIActions } from './ai';
import { checkVictory } from './victory';
import { isAdjacent } from '../utils/grid';
import { d6, pick } from '../utils/dice';
import { TECH_TREE } from '../data/techs';
import { EQUIPMENT_CATALOG } from '../data/equipment';

const TERRITORY_THRESHOLD = 10;
const CONTROL_THRESHOLD   = 10;
const BASE_INCOME         = 100;
const HEAL_RATE           = 2;
const EXTORT_THRESHOLD    = 8;
const EXTORT_PAYOUT       = 100;
const BRIBE_COST          = 150;
const BRIBE_ALERT_REDUCTION = 2;
const LOW_HP_THRESHOLD    = 0.3; // fraction of maxHp below which lowHpRounds increments
const LOW_HP_MORALE_ROUNDS = 5;
const UNDERPAID_MORALE_ROUNDS = 3;

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
  players = players.map(p => p.isHuman ? p : { ...p, gangs: aiWithActions });

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

  // Step 3b: Process TERRITORY actions
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

        // Communication center bonus: +5 reputation per conquest
        const hasCommCenter = grid.sectors.flat().some(s =>
          s.buildings.some(b => b.type === 'communication_center' && b.owner === player.id),
        );
        if (hasCommCenter) {
          player.prestige += 5;
          log.push({ message: `${player.name} comm network reports conquest — +5 reputation!`, type: 'control' });
        }
      } else {
        log.push({
          message: `${gang.name} contests [${gang.position}] (${sector.controlProgress}/${TERRITORY_THRESHOLD})`,
          type: 'control',
        });
      }
    }
  }

  // Step 4: Process ATTACK actions
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

      // Armory tile bonus (attacker's tile and defender's tile)
      const atkSector = grid.sectors[gang.position[0]][gang.position[1]];
      const defSector = grid.sectors[targetGang.position[0]][targetGang.position[1]];
      const atkTileBonus = getTileBonus(atkSector, player.id);
      const defTileBonus = getTileBonus(defSector, targetPlayer.id);

      const result = resolveCombat(gang, targetGang, atkTileBonus, defTileBonus);
      gang.hp       = Math.max(0, gang.hp - result.attackerDamage);
      targetGang.hp = Math.max(0, targetGang.hp - result.defenderDamage);
      if (gang.hp <= 0)       gang.status = 'dead';
      if (targetGang.hp <= 0) targetGang.status = 'dead';

      log.push({ message: result.log, type: 'combat' });
      alertDelta += 1;

      if (result.defenderEliminated) log.push({ message: `${targetGang.name} eliminated!`, type: 'combat' });
      if (result.attackerEliminated) log.push({ message: `${gang.name} eliminated!`,       type: 'combat' });
    }
  }

  // Step 5: Process CONTROL actions
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'control') continue;
      const buildingId = gang.currentAction.targetBuildingId;
      if (!gang.position) continue;
      const sector = grid.sectors[gang.position[0]][gang.position[1]];
      if (sector.owner !== player.id) continue;
      const building = sector.buildings.find(b => b.id === buildingId);
      if (!building || building.owner === player.id) continue;

      if (building.controllingPlayerId && building.controllingPlayerId !== player.id) {
        building.controlProgress = 0;
      }
      building.controllingPlayerId = player.id;
      const contrib = building.extortedBy.includes(player.id)
        ? Math.max(1, Math.floor(gang.control / 2))
        : gang.control;
      building.controlProgress = Math.min(CONTROL_THRESHOLD, building.controlProgress + contrib);

      if (building.controlProgress >= CONTROL_THRESHOLD) {
        const prevOwner = building.owner;
        building.owner = player.id;
        building.controlled = true;
        building.controlProgress = 0;
        building.controllingPlayerId = null;
        const allOwned = sector.buildings.every(b => b.owner === player.id);
        if (allOwned) sector.owner = player.id;
        log.push({
          message: `${gang.name} seized ${BUILDING_NAME(building.type)}${prevOwner ? ` from ${players.find(p => p.id === prevOwner)?.name}` : ''}!`,
          type: 'control',
        });

        // One-time equipment grant (weaponry, military_base)
        if (building.bonus.grantEquipmentTier && !building.equipmentGranted) {
          const tier = building.bonus.grantEquipmentTier;
          const options = EQUIPMENT_CATALOG.filter(e => e.tier === tier);
          if (options.length > 0) {
            const eq = options[Math.floor(Math.random() * options.length)];
            gang.equipment = [...gang.equipment, { ...eq }];
            log.push({ message: `${gang.name} found: ${eq.name} (T${tier})!`, type: 'event' });
          }
          building.equipmentGranted = true;
        }
      } else {
        log.push({
          message: `${gang.name} controlling ${BUILDING_NAME(building.type)} (${building.controlProgress}/${CONTROL_THRESHOLD})`,
          type: 'control',
        });
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
        log.push({ message: `${gang.name} extorts ${BUILDING_NAME(building.type)} — +$${EXTORT_PAYOUT}`, type: 'economy' });
      } else {
        alertDelta += 2;
        log.push({ message: `${gang.name}'s extortion discovered! Alert +2`, type: 'combat' });
      }
    }
  }

  // Step 5c: Process RESEARCH actions (with laboratory tile bonus)
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'research') continue;
      const techId = gang.currentAction.techId;
      const tech = TECH_TREE.find(t => t.id === techId);
      if (!tech || player.unlockedTechs.includes(techId)) continue;

      const labBonus = gang.position
        ? grid.sectors[gang.position[0]][gang.position[1]].buildings
            .filter(b => b.owner === player.id)
            .reduce((sum, b) => sum + (b.bonus.researchBonus ?? 0), 0)
        : 0;

      player.researchProgress = { ...player.researchProgress };
      player.researchProgress[techId] = (player.researchProgress[techId] ?? 0) + gang.research + labBonus;

      if (player.researchProgress[techId] >= tech.cost) {
        player.unlockedTechs = [...player.unlockedTechs, techId];
        delete player.researchProgress[techId];
        log.push({ message: `${player.name} unlocked ${tech.name}!`, type: 'research' });
      } else {
        log.push({
          message: `${gang.name} researches ${tech.name} (${player.researchProgress[techId]}/${tech.cost})${labBonus > 0 ? ' (lab)' : ''}`,
          type: 'research',
        });
      }
    }
  }

  // Step 5d: Process BRIBE actions
  for (const player of players) {
    const bribingGang = player.gangs.find(g => g.currentAction?.type === 'bribe' && g.status === 'active');
    if (bribingGang && player.cash >= BRIBE_COST) {
      player.cash -= BRIBE_COST;
      alertDelta -= BRIBE_ALERT_REDUCTION;
      log.push({ message: `${player.name} bribes the authorities — Alert −${BRIBE_ALERT_REDUCTION}`, type: 'system' });
    }
  }

  // Step 5e: Process PRAY actions (with altar tile bonus)
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.status !== 'active' || gang.currentAction?.type !== 'pray') continue;
      if (!gang.position) continue;

      const sector = grid.sectors[gang.position[0]][gang.position[1]];
      const altarBonus = sector.buildings
        .filter(b => b.owner === player.id)
        .reduce((sum, b) => sum + (b.bonus.prayBonus ?? 0), 0);

      const prayValue = gang.divine + altarBonus;
      player.religion = Math.min(100, player.religion + prayValue);
      log.push({
        message: `${gang.name} prays — +${prayValue} faith (${player.religion}/100)${altarBonus > 0 ? ' (altar)' : ''}`,
        type: 'event',
      });
    }
  }

  // Religion milestone checks (human player only)
  const humanPlayer = players.find(p => p.isHuman);
  if (humanPlayer) {
    checkAndApplyReligionGifts(humanPlayer, grid, log);
  }

  // Step 6: Process HEAL actions (with hospital tile bonus)
  for (const player of players) {
    for (const gang of player.gangs) {
      if (gang.currentAction?.type !== 'heal') continue;
      if (gang.status === 'dead') continue;
      const healSector = gang.position ? grid.sectors[gang.position[0]][gang.position[1]] : null;
      const tileHealBonus = healSector
        ? healSector.buildings
            .filter(b => b.owner === player.id)
            .reduce((sum, b) => sum + (b.bonus.healBonus ?? 0), 0)
        : 0;
      const healRate = HEAL_RATE + tileHealBonus;
      const healedHp = Math.min(gang.maxHp - gang.hp, healRate);
      const healedMorale = Math.min(gang.maxMorale - gang.morale, 1);
      gang.hp += healedHp;
      gang.morale += healedMorale;
      gang.status = 'active';
      if (healedHp > 0 || healedMorale > 0) {
        log.push({
          message: `${gang.name} recovers +${healedHp} HP${tileHealBonus > 0 ? ' (hospital)' : ''}`,
          type: 'event',
        });
      }
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
      if (gang.status === 'hiding' && gang.currentAction?.type !== 'hide') {
        gang.status = 'active';
      }
    }
  }

  // Step 8: Income + maintenance
  for (const player of players) {
    let income = BASE_INCOME;
    let repDelta = 0;
    for (const row of grid.sectors) {
      for (const sector of row) {
        for (const building of sector.buildings) {
          if (building.owner !== player.id) continue;
          if (building.bonus.incomeBonus)       income    += building.bonus.incomeBonus;
          if (building.bonus.reputationPerTurn) repDelta  += building.bonus.reputationPerTurn;
          if (building.bonus.reduceWanted)      player.wanted = Math.max(0, player.wanted - building.bonus.reduceWanted);
          if (building.bonus.increaseWanted)    player.wanted += building.bonus.increaseWanted;
        }
      }
    }
    if (repDelta !== 0) player.prestige = Math.max(0, player.prestige + repDelta);

    // Illegal equipment: raise wanted per turn while carried
    for (const gang of player.gangs.filter(g => g.status !== 'dead')) {
      for (const item of gang.equipment) {
        if (item.wantedCost) {
          player.wanted += item.wantedCost;
          if (player.isHuman) {
            log.push({ message: `⚠ ${gang.name} carries ${item.name} — +${item.wantedCost} wanted`, type: 'system' });
          }
        }
      }
    }

    const activeGangs = player.gangs.filter(g => g.status !== 'dead');
    const maintenance = activeGangs.reduce((sum, g) => sum + g.maintenanceCost, 0);
    player.cash += income - maintenance;
    log.push({ message: `${player.name}: +$${income} income, -$${maintenance} upkeep`, type: 'economy' });

    // Gradual desertion for underpaid gangs
    if (player.cash < 0) {
      for (const gang of activeGangs) {
        gang.underpaidRounds++;
        if (gang.underpaidRounds >= UNDERPAID_MORALE_ROUNDS) {
          gang.morale = Math.max(0, gang.morale - 1);
          if (gang.morale <= 0) {
            gang.status = 'dead';
            log.push({ message: `${gang.name} deserts — 3 turns unpaid!`, type: 'economy' });
          } else {
            log.push({ message: `${gang.name} is underpaid — morale dropping!`, type: 'economy' });
          }
        }
      }
      player.cash = 0;
    } else {
      // Recover underpaid counter when solvent
      for (const gang of activeGangs) {
        if (gang.underpaidRounds > 0) gang.underpaidRounds = Math.max(0, gang.underpaidRounds - 1);
      }
    }
  }

  // Step 8b: Police alert effects (based on alert level at turn start)
  const currentAlert = state.alertSystem.level as number;

  if (currentAlert >= 5) {
    const withGangs = players.filter(p => p.gangs.some(g => g.status === 'active'));
    for (const player of withGangs) {
      const target = player.gangs.filter(g => g.status === 'active').sort((a, b) => b.hp - a.hp)[0];
      if (target) {
        target.hp = Math.max(0, target.hp - 3);
        if (target.hp <= 0) target.status = 'dead';
        log.push({ message: `CRACKDOWN: ${player.name}'s ${target.name} hit for 3 by police!`, type: 'system' });
      }
    }
  } else if (currentAlert === 4) {
    const heat = (p: typeof players[0]) =>
      p.gangs.filter(g => g.currentAction?.type === 'attack' || g.currentAction?.type === 'extort').length;
    const mostWanted = players.slice().sort((a, b) => heat(b) - heat(a))[0];
    const target = mostWanted.gangs.filter(g => g.status === 'active').sort((a, b) => b.hp - a.hp)[0];
    if (target) {
      target.hp = Math.max(0, target.hp - 2);
      if (target.hp <= 0) target.status = 'dead';
      log.push({ message: `POLICE SQUAD raids ${mostWanted.name} — ${target.name} hit for 2!`, type: 'system' });
      alertDelta += 1;
    }
  } else if (currentAlert >= 2) {
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
            gang.hp = Math.max(0, gang.hp - 1);
            if (gang.hp <= 0) gang.status = 'dead';
            log.push({ message: `Police patrol spots ${gang.name} at [${pr},${pc}]! −1 HP`, type: 'system' });
          }
        }
      }
    }
  }

  // Step 9: Morale degradation from low HP and bless expiry
  for (const player of players) {
    for (const gang of player.gangs.filter(g => g.status !== 'dead')) {
      // Low HP tracking
      if (gang.hp < gang.maxHp * LOW_HP_THRESHOLD) {
        gang.lowHpRounds++;
        if (gang.lowHpRounds >= LOW_HP_MORALE_ROUNDS) {
          gang.morale = Math.max(0, gang.morale - 1);
          if (gang.morale <= 0) {
            gang.status = 'dead';
            log.push({ message: `${gang.name} breaks and retreats — too wounded for too long!`, type: 'event' });
          } else {
            log.push({ message: `${gang.name} suffering from wounds — morale dropping.`, type: 'event' });
          }
        }
      } else {
        gang.lowHpRounds = 0;
      }

      // Decrement bless buff
      if (gang.blessTurns > 0) {
        gang.blessTurns--;
        if (gang.blessTurns <= 0) gang.blessBonus = 0;
      }

      // Decrement divine sight on player
      if (player.isHuman && player.divineSightTurns > 0) {
        player.divineSightTurns--;
      }
    }
  }

  // Step 10: Alert — natural decay if no combat
  if (alertDelta === 0) alertDelta = -1;

  // Step 11: Clear actions
  players = players.map(p => ({
    ...p,
    gangs: p.gangs.map(g => ({ ...g, currentAction: null })),
  }));

  // Step 12: Sync grid + victory check
  grid = syncGangsPresent(grid, players);
  const winner = checkVictory({ ...state, players, grid });

  return { players, grid, log, alertDelta, winner };
}

function BUILDING_NAME(type: string): string {
  return type.replace(/_/g, ' ');
}

function getTileBonus(
  sector: GameState['grid']['sectors'][number][number],
  playerId: string,
): { attack: number; defense: number } {
  let attack = 0;
  let defense = 0;
  for (const b of sector.buildings) {
    if (b.owner === playerId) {
      attack  += b.bonus.attackBonus  ?? 0;
      defense += b.bonus.defenseBonus ?? 0;
    }
  }
  return { attack, defense };
}

function deepCloneGrid(grid: GameState['grid']): GameState['grid'] {
  return {
    sectors: grid.sectors.map(row =>
      row.map(sector => ({
        ...sector,
        buildings: sector.buildings.map(b => ({ ...b, extortedBy: [...b.extortedBy] })),
        gangsPresent: [...sector.gangsPresent],
      })),
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
