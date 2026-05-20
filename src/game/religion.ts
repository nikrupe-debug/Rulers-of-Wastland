import type { Player, CityGrid, LogEntry } from '../types/game';
import { TECH_TREE } from '../data/techs';

export const RELIGION_THRESHOLDS = [20, 40, 60, 80, 100];

export function checkAndApplyReligionGifts(
  player: Player,
  _grid: CityGrid,
  log: Omit<LogEntry, 'turn'>[],
): void {
  for (const threshold of RELIGION_THRESHOLDS) {
    if (player.religion >= threshold && !player.religionGiftsTriggered.includes(threshold)) {
      applyGift(threshold, player, log);
      player.religionGiftsTriggered = [...player.religionGiftsTriggered, threshold];
    }
  }
}

function applyGift(
  threshold: number,
  player: Player,
  log: Omit<LogEntry, 'turn'>[],
): void {
  const activeGangs = player.gangs.filter(g => g.status !== 'dead');

  switch (threshold) {
    case 20: {
      // Boost all in-progress research
      let boosted = false;
      for (const techId of Object.keys(player.researchProgress)) {
        player.researchProgress[techId] = (player.researchProgress[techId] ?? 0) + 5;
        boosted = true;
      }
      log.push({
        message: boosted
          ? '✝ Divine gift (Faith 20): Research boosted +5!'
          : '✝ Divine gift (Faith 20): Blessed — no research in progress.',
        type: 'research',
      });
      break;
    }

    case 40: {
      // Heal all active gangs +3 HP
      for (const gang of activeGangs) {
        gang.hp = Math.min(gang.maxHp, gang.hp + 3);
      }
      log.push({ message: '✝ Divine gift (Faith 40): All units healed +3 HP!', type: 'event' });
      break;
    }

    case 60: {
      // +2 morale for all active gangs
      for (const gang of activeGangs) {
        gang.morale = Math.min(gang.maxMorale, gang.morale + 2);
        gang.lowHpRounds = 0;
        gang.underpaidRounds = 0;
      }
      log.push({ message: '✝ Divine gift (Faith 60): All units +2 morale, suffering cleared!', type: 'event' });
      break;
    }

    case 80: {
      // Full restoration for all active gangs
      for (const gang of activeGangs) {
        gang.hp = gang.maxHp;
        gang.morale = gang.maxMorale;
        gang.lowHpRounds = 0;
        gang.underpaidRounds = 0;
      }
      log.push({ message: '✝ Divine gift (Faith 80): All units fully restored!', type: 'event' });
      break;
    }

    case 100: {
      // Complete one random unresearched tech
      const inProgress = Object.keys(player.researchProgress);
      if (inProgress.length > 0) {
        const techId = inProgress[Math.floor(Math.random() * inProgress.length)];
        const tech = TECH_TREE.find(t => t.id === techId);
        player.unlockedTechs = [...player.unlockedTechs, techId];
        delete player.researchProgress[techId];
        log.push({
          message: `✝ Divine gift (Faith 100): ${tech?.name ?? techId} completed by divine will!`,
          type: 'research',
        });
      } else {
        player.prestige += 20;
        log.push({ message: '✝ Divine gift (Faith 100): +20 Prestige from divine blessing!', type: 'event' });
      }
      break;
    }
  }
}
