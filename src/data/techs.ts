import type { Tech } from '../types/game';

export const TECH_TREE: Tech[] = [
  // Tier 1
  {
    id: 'street_intel',
    name: 'Street Intel',
    description: 'Tap the wasteland grapevine. +1 grid visibility radius for all your gangs.',
    tier: 1,
    cost: 5,
    effect: { visibilityRadius: 1 },
  },
  {
    id: 'basic_medkits',
    name: 'Basic Medkits',
    description: 'Duct tape and hope, scientifically optimized. Gangs heal 50% faster.',
    tier: 1,
    cost: 5,
    effect: { healSpeedMultiplier: 1.5 },
  },
  {
    id: 'improved_comms',
    name: 'Improved Comms',
    description: 'Once per turn, one gang may receive two action orders instead of one.',
    tier: 1,
    cost: 6,
    effect: { extraActions: 1 },
  },

  // Tier 2
  {
    id: 'hacking_tools',
    name: 'Hacking Tools',
    description: 'Bypass the paperwork. One-use instant building control — no action turn required.',
    tier: 2,
    cost: 10,
    effect: { instantControl: true },
  },
  {
    id: 'body_armor_mk1',
    name: 'Body Armor Mk1',
    description: 'Mass-produced carapace plating. All your gangs gain +2 effective defense.',
    tier: 2,
    cost: 10,
    effect: { defenseBonus: 2 },
  },
  {
    id: 'surveillance_net',
    name: 'Surveillance Net',
    description: 'Cameras on every corner. You can now see all enemy gang positions on the grid.',
    tier: 2,
    cost: 10,
    effect: { revealEnemies: true },
  },

  // Tier 3
  {
    id: 'neural_uplink',
    name: 'Neural Uplink',
    description: 'Overclock your crew. All gang stats +3 for 3 turns. Side effects unconfirmed.',
    tier: 3,
    cost: 18,
    effect: { statBonus: 3, statBonusDuration: 3 },
  },
  {
    id: 'emp_device',
    name: 'EMP Device',
    description: 'Fries everything in a sector. All gangs present lose their next action.',
    tier: 3,
    cost: 18,
    effect: { empRadius: 1 },
  },
  {
    id: 'corporate_mole',
    name: 'Corporate Mole',
    description: 'An inside man. Siphon income from your highest-earning rival every turn.',
    tier: 3,
    cost: 20,
    effect: { incomeSteal: 30 },
  },
  {
    id: 'shadow_protocol',
    name: 'Shadow Protocol',
    description: 'Full blackout mode. All your gangs gain +5 stealth for 3 turns.',
    tier: 3,
    cost: 18,
    effect: { stealthBonus: 5, stealthDuration: 3 },
  },
];
