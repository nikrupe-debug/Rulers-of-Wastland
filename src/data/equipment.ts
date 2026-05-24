import type { Equipment } from '../types/game';

export const EQUIPMENT_CATALOG: Equipment[] = [

  // ════════════════════════════════════════════════════════════════
  // COMMON  (+1 single trait)   tier 1
  // ════════════════════════════════════════════════════════════════

  // — Attack ————————————————————————————————————————————————————————
  {
    id: 'persuader', name: 'The Persuader', rarity: 'common', type: 'weapon', cost: 50, tier: 1,
    flavor: 'A length of heavy electrical cable wrapped in duct tape at one end as a handle.',
    bonus: { attack: 1 }, uses: 'unlimited',
  },
  {
    id: 'keyboard_flail', name: 'Keyboard Flail', rarity: 'common', type: 'weapon', cost: 50, tier: 1,
    flavor: 'An old mechanical keyboard on a chain. Heavy, loud, and somehow intimidating.',
    bonus: { attack: 1 }, uses: 'unlimited',
  },
  {
    id: 'shard_glove', name: 'Shard Glove', rarity: 'common', type: 'weapon', cost: 50, tier: 1,
    flavor: 'A work glove with broken smartphone screens embedded in the knuckles.',
    bonus: { attack: 1 }, uses: 'unlimited',
  },
  {
    id: 'socket_wrench', name: 'Socket Wrench', rarity: 'common', type: 'weapon', cost: 50, tier: 1,
    flavor: 'A large industrial wrench salvaged from a maintenance depot.',
    bonus: { attack: 1 }, uses: 'unlimited',
  },
  {
    id: 'signal_pistol', name: 'Signal Pistol', rarity: 'common', type: 'weapon', cost: 50, tier: 1,
    flavor: 'Probably a barcode scanner. Modified to fire small projectiles. Nobody is sure how it works but it does.',
    bonus: { attack: 1 }, uses: 'unlimited',
  },

  // — Defense ————————————————————————————————————————————————————————
  {
    id: 'bubble_wrap_vest', name: 'Bubble Wrap Vest', rarity: 'common', type: 'armor', cost: 50, tier: 1,
    flavor: 'Layers of industrial bubble wrap under a jacket. Surprisingly effective, very noisy.',
    bonus: { defense: 1 }, uses: 'unlimited',
  },
  {
    id: 'router_shield', name: 'Router Shield', rarity: 'common', type: 'armor', cost: 50, tier: 1,
    flavor: 'An old wifi router bolted to a forearm bracer. The casing is solid.',
    bonus: { defense: 1 }, uses: 'unlimited',
  },
  {
    id: 'bike_helmet', name: 'Bike Helmet', rarity: 'common', type: 'armor', cost: 50, tier: 1,
    flavor: 'Repurposed cycling helmet, sometimes with extra padding or scrap welded on. Dented but dependable.',
    bonus: { defense: 1 }, uses: 'unlimited',
  },
  {
    id: 'scrapplate_armor', name: 'Scrapplate Armor', rarity: 'common', type: 'armor', cost: 50, tier: 1,
    flavor: 'Mismatched plates of metal, hard plastic, and leather strapped together. Heavy, ugly, functional.',
    bonus: { defense: 1 }, uses: 'unlimited',
  },
  {
    id: 'leather_vest', name: 'Leather Vest', rarity: 'common', type: 'armor', cost: 50, tier: 1,
    flavor: 'Thick salvaged leather, reinforced at the shoulders. The wasteland classic.',
    bonus: { defense: 1 }, uses: 'unlimited',
  },

  // — Stealth ————————————————————————————————————————————————————————
  {
    id: 'camo_tarp', name: 'Camo Tarp', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'A section of old military camouflage tarpaulin worn as a cloak.',
    bonus: { stealth: 1 }, uses: 'unlimited',
  },
  {
    id: 'rubber_sole_wraps', name: 'Rubber Sole Wraps', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Thick rubber strips from car tires bound around boots. Silent footsteps.',
    bonus: { stealth: 1 }, uses: 'unlimited',
  },
  {
    id: 'signal_jammer_badge', name: 'Signal Jammer Badge', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'A small device clipped to clothing. Moving through checkpoints gets easier.',
    bonus: { stealth: 1 }, uses: 'unlimited',
  },
  {
    id: 'grease_coat', name: 'Grease Coat', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'A long coat soaked in machine oil. Slips through crowds effortlessly. Smells terrible.',
    bonus: { stealth: 1 }, uses: 'unlimited',
  },
  {
    id: 'drone_skin', name: 'Drone Skin', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Patches of matte black material salvaged from old delivery drones. Reduces visibility in low light.',
    bonus: { stealth: 1 }, uses: 'unlimited',
  },

  // — Research ———————————————————————————————————————————————————————
  {
    id: 'hot_coffee', name: 'Hot Coffee', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: "Nobody knows why but things just make more sense after a cup. Incredibly rare and therefore incredibly valuable.",
    bonus: { research: 1 }, uses: 'unlimited',
  },
  {
    id: 'instruction_manual', name: 'Instruction Manual', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'A laminated technical manual for a machine that no longer exists. Cross-referencing it with current salvage occasionally yields insight.',
    bonus: { research: 1 }, uses: 'unlimited',
  },
  {
    id: 'pocket_calculator', name: 'Pocket Calculator', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Solar powered. Basic math is a superpower in the wasteland.',
    bonus: { research: 1 }, uses: 'unlimited',
  },
  {
    id: 'annotated_textbook', name: 'Annotated Textbook', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Heavily scribbled university textbook, half genius half nonsense.',
    bonus: { research: 1 }, uses: 'unlimited',
  },
  {
    id: 'lab_coat', name: 'Lab Coat', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: "Wearing it makes people trust your conclusions more. Sometimes that's enough.",
    bonus: { research: 1 }, uses: 'unlimited',
  },

  // — Control ————————————————————————————————————————————————————————
  {
    id: 'megaphone', name: 'Megaphone', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Battery powered bullhorn. Commanding presence guaranteed.',
    bonus: { control: 1 }, uses: 'unlimited',
  },
  {
    id: 'hi_vis_vest', name: 'Hi-Vis Vest', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'People still instinctively follow anyone wearing one.',
    bonus: { control: 1 }, uses: 'unlimited',
  },
  {
    id: 'clipboard', name: 'Clipboard', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Carry it with confidence and people assume you\'re in charge.',
    bonus: { control: 1 }, uses: 'unlimited',
  },
  {
    id: 'head_on_stick', name: 'Head on a Stick', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: "Extremely convincing negotiation tool. Nobody asks whose it was.",
    bonus: { control: 1 }, uses: 'unlimited',
  },
  {
    id: 'fireworks', name: 'Fireworks', rarity: 'common', type: 'gadget', cost: 50, tier: 1,
    flavor: 'Nothing establishes authority like an unexpected light show. Also useful as a distraction.',
    bonus: { control: 1 }, uses: 3,
  },

  // ════════════════════════════════════════════════════════════════
  // RARE  (+2 single trait OR +1 to two traits)   tier 2
  // ════════════════════════════════════════════════════════════════

  // — +2 Attack ——————————————————————————————————————————————————————
  {
    id: 'dentists_drill', name: "The Dentist's Drill", rarity: 'rare', type: 'weapon', cost: 150, tier: 2,
    flavor: 'A repurposed dental drill modified into a close range weapon. Horrifying on every level.',
    bonus: { attack: 2 }, uses: 'unlimited',
  },
  {
    id: 'nail_gun', name: 'Nail Gun', rarity: 'rare', type: 'weapon', cost: 150, tier: 2,
    flavor: 'Salvaged construction nail gun, still has half a cartridge. Nobody knows how to refill it but it lasts.',
    bonus: { attack: 2 }, uses: 'unlimited',
  },
  {
    id: 'the_convincer', name: 'The Convincer', rarity: 'rare', type: 'weapon', cost: 150, tier: 2,
    flavor: 'A baseball bat with a car battery wired to it. Delivers a shocking argument.',
    bonus: { attack: 2 }, uses: 'unlimited',
  },

  // — +2 Defense —————————————————————————————————————————————————————
  {
    id: 'riot_shield', name: 'Riot Shield', rarity: 'rare', type: 'armor', cost: 150, tier: 2,
    flavor: 'Genuine pre-collapse police riot shield. Cracked but largely intact. Treated like an antique.',
    bonus: { defense: 2 }, uses: 'unlimited',
  },
  {
    id: 'motorcycle_suit', name: 'Motorcycle Suit', rarity: 'rare', type: 'armor', cost: 150, tier: 2,
    flavor: 'Full leather and padding motorcycle racing suit. Scuffed but surprisingly complete.',
    bonus: { defense: 2 }, uses: 'unlimited',
  },
  {
    id: 'manhole_cover_cape', name: 'Manhole Cover Cape', rarity: 'rare', type: 'armor', cost: 150, tier: 2,
    flavor: 'A manhole cover on a chain worn as a back shield. Heavy, absurd, genuinely effective.',
    bonus: { defense: 2 }, uses: 'unlimited',
  },

  // — +2 Stealth —————————————————————————————————————————————————————
  {
    id: 'ghillie_suit', name: 'Ghillie Suit', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'Painstakingly assembled from netting, rags, and vegetation. Renders wearer nearly invisible outdoors.',
    bonus: { stealth: 2 }, uses: 'unlimited',
  },
  {
    id: 'emp_bracelet', name: 'EMP Bracelet', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'A device that scrambles nearby electronic sensors. Nobody knows how it works. Nobody questions it.',
    bonus: { stealth: 2 }, uses: 'unlimited',
  },
  {
    id: 'soundproofing_cloak', name: 'Soundproofing Cloak', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'Strips of old studio soundproofing foam sewn into a cloak. Eerily silent movement.',
    bonus: { stealth: 2 }, uses: 'unlimited',
  },

  // — +2 Research ————————————————————————————————————————————————————
  {
    id: 'thinkers_glasses', name: "Thinker's Glasses", rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'Salvaged prescription glasses with notes and diagrams etched into the lenses. Somehow makes everything clearer.',
    bonus: { research: 2 }, uses: 'unlimited',
  },
  {
    id: 'encyclopedia_set', name: 'Encyclopedia Volume Set', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'A complete pre-collapse encyclopedia set carried in a backpack. Heavy but priceless.',
    bonus: { research: 2 }, uses: 'unlimited',
  },
  {
    id: 'chemistry_set', name: 'Chemistry Set', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'A mostly intact school chemistry set. Enables experiments nobody fully understands but occasionally works brilliantly.',
    bonus: { research: 2 }, uses: 'unlimited',
  },

  // — +2 Control —————————————————————————————————————————————————————
  {
    id: 'sheriffs_jacket', name: "Sheriff's Jacket", rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'Genuine pre-collapse law enforcement jacket. Just wearing it makes people nervous in the right way.',
    bonus: { control: 2 }, uses: 'unlimited',
  },
  {
    id: 'portable_pa', name: 'Portable PA System', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'A battery powered public address system on a trolley. Your voice now fills entire city blocks.',
    bonus: { control: 2 }, uses: 'unlimited',
  },
  {
    id: 'the_throne', name: 'The Throne', rarity: 'rare', type: 'gadget', cost: 150, tier: 2,
    flavor: 'A large office chair on wheels, pushed by a follower. Absurd. Inexplicably commands respect.',
    bonus: { control: 2 }, uses: 'unlimited',
  },

  // — +1 Attack +1 Defense ———————————————————————————————————————————
  {
    id: 'combat_harness', name: 'Combat Harness', rarity: 'rare', type: 'weapon', cost: 130, tier: 2,
    flavor: 'A full body webbing harness salvaged from a security depot. Holds weapons and deflects glancing blows.',
    bonus: { attack: 1, defense: 1 }, uses: 'unlimited',
  },
  {
    id: 'spiked_jacket', name: 'Spiked Jacket', rarity: 'rare', type: 'weapon', cost: 130, tier: 2,
    flavor: 'A leather jacket with metal spikes welded on. Hurts to hit and hurts to be hit by.',
    bonus: { attack: 1, defense: 1 }, uses: 'unlimited',
  },

  // — +1 Attack +1 Stealth ———————————————————————————————————————————
  {
    id: 'silenced_staple_gun', name: 'Silenced Staple Gun', rarity: 'rare', type: 'weapon', cost: 130, tier: 2,
    flavor: 'An industrial staple gun wrapped in foam. Quiet, painful, deeply undignified.',
    bonus: { attack: 1, stealth: 1 }, uses: 'unlimited',
  },

  // — +1 Attack +1 Research ——————————————————————————————————————————
  {
    id: 'scalpel_kit', name: 'The Scalpel Kit', rarity: 'rare', type: 'weapon', cost: 130, tier: 2,
    flavor: "A surgeon's scalpel set. Precise in combat and invaluable for technical dissection of old machinery.",
    bonus: { attack: 1, research: 1 }, uses: 'unlimited',
  },

  // — +1 Attack +1 Control ———————————————————————————————————————————
  {
    id: 'bullhorn_baton', name: 'Bullhorn Baton', rarity: 'rare', type: 'weapon', cost: 130, tier: 2,
    flavor: 'A police baton with a small speaker attached. Issue commands while cracking skulls.',
    bonus: { attack: 1, control: 1 }, uses: 'unlimited',
  },

  // — +1 Defense +1 Stealth ——————————————————————————————————————————
  {
    id: 'mirrorfilm_poncho', name: 'Mirrorfilm Poncho', rarity: 'rare', type: 'armor', cost: 130, tier: 2,
    flavor: 'A poncho made of reflective window film. Confuses attackers and blends into glass-heavy urban ruins.',
    bonus: { defense: 1, stealth: 1 }, uses: 'unlimited',
  },

  // — +1 Defense +1 Research —————————————————————————————————————————
  {
    id: 'reinforced_bike_helmet', name: 'Reinforced Bike Helmet', rarity: 'rare', type: 'armor', cost: 130, tier: 2,
    flavor: 'A bike helmet with extra padding and scrawled technical notes inside.',
    bonus: { defense: 1, research: 1 }, uses: 'unlimited',
  },

  // — +1 Defense +1 Control ——————————————————————————————————————————
  {
    id: 'commanders_helmet', name: "Commander's Helmet", rarity: 'rare', type: 'armor', cost: 130, tier: 2,
    flavor: 'A military-grade helmet with a mounted radio antenna. Still picks up static but looks extremely authoritative.',
    bonus: { defense: 1, control: 1 }, uses: 'unlimited',
  },

  // — +1 Stealth +1 Research —————————————————————————————————————————
  {
    id: 'night_vision_headband', name: 'Night Vision Headband', rarity: 'rare', type: 'gadget', cost: 130, tier: 2,
    flavor: 'A salvaged night vision device strapped to a headband. Works intermittently. Invaluable when it does.',
    bonus: { stealth: 1, research: 1 }, uses: 'unlimited',
  },

  // — +1 Stealth +1 Control ——————————————————————————————————————————
  {
    id: 'whisper_mic', name: 'Whisper Mic', rarity: 'rare', type: 'gadget', cost: 130, tier: 2,
    flavor: 'A throat microphone salvaged from an old tactical kit. Issue quiet commands across distances without being heard.',
    bonus: { stealth: 1, control: 1 }, uses: 'unlimited',
  },

  // — +1 Research +1 Control —————————————————————————————————————————
  {
    id: 'podium_badge', name: 'The Podium Badge', rarity: 'rare', type: 'gadget', cost: 130, tier: 2,
    flavor: 'A large official-looking badge on a lanyard. Whatever institution it\'s from no longer exists but nobody knows that.',
    bonus: { research: 1, control: 1 }, uses: 'unlimited',
  },

  // ════════════════════════════════════════════════════════════════
  // UNIQUE  (+3 single OR +2 + embedded skill)   tier 3
  // ════════════════════════════════════════════════════════════════

  // — +3 Single Trait ————————————————————————————————————————————————
  {
    id: 'the_judge', name: 'The Judge', rarity: 'unique', type: 'weapon', cost: 350, tier: 3,
    flavor: 'A full-sized traffic light post torn from the ground and wrapped in barbed wire. Devastating. Completely impractical. Somehow people make it work.',
    bonus: { attack: 3 }, uses: 'unlimited',
  },
  {
    id: 'the_bunker', name: 'The Bunker', rarity: 'unique', type: 'armor', cost: 350, tier: 3,
    flavor: 'A full bomb disposal suit, remarkably intact. Heavy as sin but nothing gets through it.',
    bonus: { defense: 3 }, uses: 'unlimited',
  },
  {
    id: 'ghost_protocol', name: 'Ghost Protocol', rarity: 'unique', type: 'gadget', cost: 350, tier: 3,
    flavor: 'A full stealth suit salvaged from what appears to be a military black site. Nobody knows which military. Nobody asks.',
    bonus: { stealth: 3 }, uses: 'unlimited',
  },
  {
    id: 'oracles_tome', name: "The Oracle's Tome", rarity: 'unique', type: 'gadget', cost: 350, tier: 3,
    flavor: 'A water-damaged server room logbook filled with pre-collapse system notes. Half is gibberish. The other half is revolutionary.',
    bonus: { research: 3 }, uses: 'unlimited',
  },
  {
    id: 'the_crown', name: 'The Crown', rarity: 'unique', type: 'gadget', cost: 350, tier: 3,
    flavor: 'A repurposed hard hat covered in salvaged LED lights, circuit boards, and wiring. Absurd. Universally recognized as a symbol of authority.',
    bonus: { control: 3 }, uses: 'unlimited',
  },

  // — +2 + Embedded Skill (skill TBD) ———————————————————————————————
  {
    id: 'carbon_fiber_armor', name: 'Carbon Fiber Armor', rarity: 'unique', type: 'armor', cost: 300, tier: 3,
    flavor: 'Painstakingly assembled from salvaged Formula 1 chassis scraps. Lightweight, incredibly strong, vaguely aerodynamic. Nobody remembers what Formula 1 was.',
    bonus: { defense: 2 }, uses: 'unlimited',
    skillRef: 'carbon_deflect',
  },
  {
    id: 'grandmas_recipe_book', name: "Grandma's Recipe Book", rarity: 'unique', type: 'gadget', cost: 300, tier: 3,
    flavor: 'A handwritten cookbook from before the collapse. Hidden between pie recipes are detailed engineering schematics. Nobody knows who Grandma was. Everyone wants to find her.',
    bonus: { research: 2 }, uses: 'unlimited',
    skillRef: 'inspired_breakthrough',
  },
  {
    id: 'doomsday_trumpet', name: 'The Doomsday Trumpet', rarity: 'unique', type: 'gadget', cost: 300, tier: 3,
    flavor: 'A repurposed air raid siren mounted on a backpack with a handheld trigger. When activated, entire districts stop what they\'re doing.',
    bonus: { control: 2 }, uses: 'unlimited',
    skillRef: 'mass_intimidation',
  },
  {
    id: 'the_biter', name: 'The Biter', rarity: 'unique', type: 'weapon', cost: 300, tier: 3,
    flavor: "A chainsaw retrofitted with actual human teeth along the blade. Nobody asks where the teeth came from. Nobody wants to know.",
    bonus: { attack: 2 }, uses: 'unlimited',
    skillRef: 'rend',
  },
  {
    id: 'disco_ball_coat', name: 'The Disco Ball Coat', rarity: 'unique', type: 'gadget', cost: 300, tier: 3,
    flavor: 'A long coat covered in hundreds of small mirrors. In open terrain reflects surroundings almost perfectly. In direct sunlight it\'s also accidentally a weapon.',
    bonus: { stealth: 2 }, uses: 'unlimited',
    skillRef: 'blinding_flash',
  },

  // ════════════════════════════════════════════════════════════════
  // ILLEGAL  (Black Market only — carrying raises wanted)   tier 4
  // ════════════════════════════════════════════════════════════════

  {
    id: 'lobotomizer', name: 'The Lobotomizer', rarity: 'illegal', type: 'weapon', cost: 400, tier: 4,
    flavor: 'A repurposed industrial brain-scanning device delivering a catastrophic neural pulse. The Order banned it after entire city blocks went silent. After 3 uses the device fuses permanently to the arm.',
    bonus: { attack: 4 }, uses: 3,
    wantedCost: 2,
  },
  {
    id: 'plague_coat', name: 'The Plague Coat', rarity: 'illegal', type: 'armor', cost: 500, tier: 4,
    flavor: 'A hazmat suit deliberately contaminated with pre-collapse biological samples. Everyone near the wearer suffers. Including the wearer.',
    bonus: { attack: 3, defense: 2 }, uses: 'unlimited',
    wantedCost: 1,
    permanentHpLoss: 2,
    cannotRemove: true,
  },
  {
    id: 'the_buzzard', name: 'The Buzzard', rarity: 'illegal', type: 'gadget', cost: 450, tier: 4,
    flavor: 'A salvaged military surveillance drone jury-rigged with a control headset. Grants extraordinary situational awareness. The user becomes so absorbed in the feed they neglect their own physical presence entirely.',
    bonus: { control: 4, attack: -1, defense: -1 }, uses: 'unlimited',
    wantedCost: 1,
  },
  {
    id: 'the_architect', name: 'The Architect', rarity: 'illegal', type: 'gadget', cost: 600, tier: 4,
    flavor: 'A mostly intact AI terminal, one of the few still partially functional. Grants enormous analytical power but the AI inside slowly takes over decision making.',
    bonus: { research: 4 }, uses: 'unlimited',
    wantedCost: 1,
    permanentStatPenalty: { control: 2 },
    cannotRemove: true,
  },
  {
    id: 'sunshine', name: 'Sunshine', rarity: 'illegal', type: 'weapon', cost: 800, tier: 4,
    flavor: 'A repurposed industrial laser cutter mounted on a shoulder rig. Absolutely devastating. Single use only — after firing it melts itself and brands a permanent mark The Order can identify from across a city. You will be found.',
    bonus: { attack: 5 }, uses: 1,
    wantedCost: 3,
  },
];
