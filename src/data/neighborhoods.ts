// 64 post-apocalyptic neighborhood names, indexed by row*8+col
export const NEIGHBORHOOD_NAMES: string[] = [
  'Ashgate',    'Rust Row',    'Cinder Cross', 'Slag End',     'Soot Quarter', 'Grimwall',    'Scorch Field', 'Bone Alley',
  'Iron Mile',  'Rad Block',   'Smoke Haven',  'Blight Ward',  'Toxin Corner', 'Dead Flats',  'Feral Run',    'Ember Gate',
  'Dust Yard',  'Doom Strip',  'Plague Lane',  'Char Town',    'Bleak Hill',   'Ruin Point',  'Wreck Side',   'Hollow Cross',
  'Rot Gate',   'Gutter Row',  'Shiv Bend',    'Acid Row',     'Blood Cross',  'Skull End',   'Grave Ward',   'Ghost Side',
  'Scrap Mile', 'Chem Pit',    'Void Row',     'Ember Cross',  'Blight Run',   'Doom Gate',   'Last Stand',   'Ash Flats',
  'Cinder Pit', 'Rust Block',  'Soot Lane',    'Grim Mile',    'Scorch End',   'Iron Row',    'Smoke Cross',  'Toxic Gate',
  'Dead Block', 'Feral Mile',  'Rad Strip',    'Skull Row',    'Bone Cross',   'Plague Pit',  'Char Row',     'Ruin Gate',
  'Bleak Run',  'Grave Cross', 'Ghost Lane',   'Scrap End',    'Ash Pit',      'Cinder Gate', 'Slag Row',     'Wreck Cross',
];

export function getNeighborhoodName(row: number, col: number): string {
  return NEIGHBORHOOD_NAMES[row * 8 + col] ?? `Zone ${row}-${col}`;
}
