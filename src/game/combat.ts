import type { Gang } from '../types/game';
import { d6 } from '../utils/dice';

export interface CombatResult {
  attackerDamage: number;
  defenderDamage: number;
  attackerEliminated: boolean;
  defenderEliminated: boolean;
  log: string;
}

interface TileBonus {
  attack: number;
  defense: number;
}

const ZERO_BONUS: TileBonus = { attack: 0, defense: 0 };

function equipSum(gang: Gang, stat: 'attack' | 'defense' | 'stealth'): number {
  return gang.equipment.reduce((sum, e) => sum + (e.bonus[stat] ?? 0), 0);
}

export function resolveCombat(
  attacker: Gang,
  defender: Gang,
  attackerTile: TileBonus = ZERO_BONUS,
  defenderTile: TileBonus = ZERO_BONUS,
): CombatResult {
  const blessA = attacker.blessTurns > 0 ? attacker.blessBonus : 0;
  const blessD = defender.blessTurns  > 0 ? defender.blessBonus  : 0;

  const atkRoll = attacker.attack  + d6() + equipSum(attacker, 'attack')  + attackerTile.attack  + blessA;
  const defRoll = defender.defense + d6() + equipSum(defender, 'defense') + defenderTile.defense;
  const cntRoll = defender.attack  + d6() + equipSum(defender, 'attack')  + defenderTile.attack  + blessD;
  const cntDefRoll = attacker.defense + d6() + equipSum(attacker, 'defense') + attackerTile.defense;

  const defenderDamage = Math.max(0, atkRoll - defRoll);
  const attackerDamage = Math.max(0, cntRoll - cntDefRoll);

  return {
    attackerDamage,
    defenderDamage,
    attackerEliminated: attacker.hp - attackerDamage <= 0,
    defenderEliminated: defender.hp - defenderDamage <= 0,
    log: `${attacker.name} [${atkRoll}atk vs ${defRoll}def] → ${
      defenderDamage > 0 ? `${defender.name} −${defenderDamage} HP` : 'no hit'
    }${attackerDamage > 0 ? ` / counter −${attackerDamage} HP` : ''}`,
  };
}
