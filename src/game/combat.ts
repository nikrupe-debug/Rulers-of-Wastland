import type { Gang } from '../types/game';
import { d6 } from '../utils/dice';

export interface CombatResult {
  attackerDamage: number;
  defenderDamage: number;
  attackerEliminated: boolean;
  defenderEliminated: boolean;
  log: string;
}

function equipBonus(gang: Gang, stat: 'combat' | 'ranged'): number {
  return gang.equipment.reduce((sum, e) => sum + (e.bonus[stat] ?? 0), 0);
}

export function resolveMelee(attacker: Gang, defender: Gang): CombatResult {
  const atkRoll = attacker.combat + d6() + equipBonus(attacker, 'combat');
  const defRoll = defender.combat + d6() + equipBonus(defender, 'combat');

  const defenderDamage = atkRoll > defRoll ? atkRoll - defRoll : 0;
  const attackerDamage = defRoll > atkRoll ? defRoll - atkRoll : 0;

  return {
    attackerDamage,
    defenderDamage,
    attackerEliminated: attacker.morale - attackerDamage <= 0,
    defenderEliminated: defender.morale - defenderDamage <= 0,
    log: `${attacker.name} [${atkRoll}] vs ${defender.name} [${defRoll}] — ${
      defenderDamage > 0 ? `${defender.name} takes ${defenderDamage} damage` :
      attackerDamage > 0 ? `${attacker.name} takes ${attackerDamage} damage` :
      'no damage (tie)'
    }`,
  };
}

export function resolveRanged(attacker: Gang, defender: Gang): CombatResult {
  const atkRoll = attacker.ranged + d6() + equipBonus(attacker, 'ranged');
  const defRoll = defender.combat + d6() + equipBonus(defender, 'combat');

  const defenderDamage = atkRoll > defRoll ? atkRoll - defRoll : 0;
  // ranged counter-damage is halved
  const attackerDamage = defRoll > atkRoll ? Math.ceil((defRoll - atkRoll) / 2) : 0;

  return {
    attackerDamage,
    defenderDamage,
    attackerEliminated: attacker.morale - attackerDamage <= 0,
    defenderEliminated: defender.morale - defenderDamage <= 0,
    log: `${attacker.name} [ranged ${atkRoll}] vs ${defender.name} [${defRoll}] — ${
      defenderDamage > 0 ? `${defender.name} takes ${defenderDamage} damage` :
      attackerDamage > 0 ? `${attacker.name} takes ${attackerDamage} return fire` :
      'miss'
    }`,
  };
}
