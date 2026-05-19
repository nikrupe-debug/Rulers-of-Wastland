import type { Equipment } from '../types/game';

export const EQUIPMENT_CATALOG: Equipment[] = [
  // Weapons
  { id: 'scrap_blade',   name: 'Scrap Blade',    type: 'weapon', cost: 80,  bonus: { combat: 2 },             uses: 'unlimited' },
  { id: 'pipe_rifle',    name: 'Pipe Rifle',      type: 'weapon', cost: 100, bonus: { ranged: 2 },             uses: 'unlimited' },
  { id: 'plasma_pistol', name: 'Plasma Pistol',   type: 'weapon', cost: 200, bonus: { ranged: 3, combat: 1 },  uses: 'unlimited' },
  { id: 'frag_grenades', name: 'Frag Grenades',   type: 'weapon', cost: 120, bonus: { combat: 3, ranged: 1 },  uses: 3 },
  { id: 'sawn_off',      name: 'Sawn-Off Blaster',type: 'weapon', cost: 150, bonus: { combat: 2, ranged: 2 },  uses: 'unlimited' },

  // Armor
  { id: 'leather_pads',  name: 'Leather Pads',    type: 'armor',  cost: 60,  bonus: { combat: 1 },             uses: 'unlimited' },
  { id: 'riot_shield',   name: 'Riot Shield',      type: 'armor',  cost: 150, bonus: { combat: 2 },             uses: 'unlimited' },
  { id: 'scrap_plate',   name: 'Scrap Plate',      type: 'armor',  cost: 220, bonus: { combat: 3 },             uses: 'unlimited' },

  // Gadgets
  { id: 'smoke_bomb',    name: 'Smoke Bomb',       type: 'gadget', cost: 80,  bonus: { stealth: 3 },            uses: 2 },
  { id: 'hacking_deck',  name: 'Hacking Deck',     type: 'gadget', cost: 180, bonus: { stealth: 2 },            uses: 'unlimited' },
  { id: 'stim_pack',     name: 'Stim Pack',        type: 'gadget', cost: 100, bonus: { combat: 1, ranged: 1 },  uses: 3 },
  { id: 'ghost_cloak',   name: 'Ghost Cloak',      type: 'gadget', cost: 300, bonus: { stealth: 4 },            uses: 'unlimited' },
];
