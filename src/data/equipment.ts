import type { Equipment } from '../types/game';

export const EQUIPMENT_CATALOG: Equipment[] = [
  // Weapons — tier 1
  { id: 'scrap_blade',   name: 'Scrap Blade',      type: 'weapon', cost: 80,  tier: 1, bonus: { attack: 2 },            uses: 'unlimited' },
  { id: 'pipe_rifle',    name: 'Pipe Rifle',        type: 'weapon', cost: 100, tier: 1, bonus: { attack: 2 },            uses: 'unlimited' },
  // Weapons — tier 2
  { id: 'sawn_off',      name: 'Sawn-Off Blaster',  type: 'weapon', cost: 150, tier: 2, bonus: { attack: 3 },            uses: 'unlimited' },
  { id: 'frag_grenades', name: 'Frag Grenades',     type: 'weapon', cost: 120, tier: 2, bonus: { attack: 3 },            uses: 3 },
  { id: 'plasma_pistol', name: 'Plasma Pistol',     type: 'weapon', cost: 200, tier: 2, bonus: { attack: 4 },            uses: 'unlimited' },
  // Armor — tier 1
  { id: 'leather_pads',  name: 'Leather Pads',      type: 'armor',  cost: 60,  tier: 1, bonus: { defense: 1 },           uses: 'unlimited' },
  // Armor — tier 2
  { id: 'riot_shield',   name: 'Riot Shield',       type: 'armor',  cost: 150, tier: 2, bonus: { defense: 2 },           uses: 'unlimited' },
  // Armor — tier 3
  { id: 'scrap_plate',   name: 'Scrap Plate',       type: 'armor',  cost: 220, tier: 3, bonus: { defense: 3 },           uses: 'unlimited' },
  // Gadgets — tier 1
  { id: 'smoke_bomb',    name: 'Smoke Bomb',        type: 'gadget', cost: 80,  tier: 1, bonus: { stealth: 3 },           uses: 2 },
  { id: 'stim_pack',     name: 'Stim Pack',         type: 'gadget', cost: 100, tier: 1, bonus: { attack: 2 },            uses: 3 },
  // Gadgets — tier 2
  { id: 'hacking_deck',  name: 'Hacking Deck',      type: 'gadget', cost: 180, tier: 2, bonus: { stealth: 2 },           uses: 'unlimited' },
  // Gadgets — tier 3
  { id: 'ghost_cloak',   name: 'Ghost Cloak',       type: 'gadget', cost: 300, tier: 3, bonus: { stealth: 4 },           uses: 'unlimited' },
];
