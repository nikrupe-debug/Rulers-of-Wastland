export function getAdjacentPositions(
  [row, col]: [number, number],
  size = 8
): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        neighbors.push([r, c]);
      }
    }
  }
  return neighbors;
}

export function isAdjacent(
  a: [number, number],
  b: [number, number]
): boolean {
  return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && (a[0] !== b[0] || a[1] !== b[1]);
}

export function distance(a: [number, number], b: [number, number]): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

export function posKey(pos: [number, number]): string {
  return `${pos[0]},${pos[1]}`;
}
