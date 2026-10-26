import type { Biome, MapData, Tile } from '../net/protocol';
import { rng } from '../render/palette';

/**
 * Office campus of the mock hub: a walled building with an atrium in the middle,
 * two open-plan offices (north), meeting rooms (south-west), the lab (south-east),
 * the lounge (south) and a green patio inside the atrium; garden all around.
 */

/** Atrium centre: where people meet. */
export const VILLAGE = { x: 21, y: 18 };
/** Idea board in the atrium: findings (data) are pinned here. */
export const STOCKPILE = { x: 23, y: 20 };
/** Fitted meeting rooms (shelter 2) and whiteboard corners (shelter 1). */
export const HUTS = [
  { x: 6, y: 27, level: 2 as const },
  { x: 11, y: 27, level: 2 as const },
  { x: 6, y: 31, level: 1 as const },
  { x: 12, y: 31, level: 1 as const },
];
/** Free corner the designers fit out (whiteboard -> fitted room). */
export const BUILD_SITE = { x: 9, y: 31 };
/** Coffee machines in the lounge. */
export const COFFEE = [
  { x: 18, y: 26 },
  { x: 24, y: 26 },
];

const BUILDING = { x0: 1, y0: 1, x1: 42, y1: 35 };

interface Zone {
  biome: Biome;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Zones inside the building, painted in order. */
const ZONES: Zone[] = [
  { biome: 'plaza', x0: 2, y0: 2, x1: 41, y1: 34 },
  { biome: 'office', x0: 2, y0: 2, x1: 14, y1: 12 },
  { biome: 'office', x0: 28, y0: 2, x1: 41, y1: 12 },
  { biome: 'garden', x0: 18, y0: 4, x1: 24, y1: 10 },
  { biome: 'meeting', x0: 2, y0: 24, x1: 14, y1: 34 },
  { biome: 'lab', x0: 28, y0: 24, x1: 41, y1: 34 },
  { biome: 'lounge', x0: 16, y0: 25, x1: 26, y1: 34 },
];

export function generateMap(w = 44, h = 38, seed = 7): MapData {
  const r = rng(seed + 3);
  const tiles: Tile[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tiles.push({ x, y, biome: 'garden', elev: 1, food: 0, wood: 0, shelter: 0 });
  const at = (x: number, y: number) => tiles[y * w + x];
  const paint = (z: Zone) => {
    for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) at(x, y).biome = z.biome;
  };
  const wallH = (y: number, x0: number, x1: number, doors: number[] = []) => {
    for (let x = x0; x <= x1; x++) if (!doors.includes(x)) at(x, y).biome = 'wall';
  };
  const wallV = (x: number, y0: number, y1: number, doors: number[] = []) => {
    for (let y = y0; y <= y1; y++) if (!doors.includes(y)) at(x, y).biome = 'wall';
  };

  ZONES.forEach(paint);
  // outer shell with entrances
  const b = BUILDING;
  wallH(b.y0, b.x0, b.x1, [21]);
  wallH(b.y1, b.x0, b.x1, [21, 22]);
  wallV(b.x0, b.y0, b.y1, [18]);
  wallV(b.x1, b.y0, b.y1, [18]);
  // partitions with doors
  wallV(15, 2, 12, [7, 11]);
  wallV(27, 2, 12, [7, 11]);
  wallH(23, 2, 14, [8]);
  wallH(23, 28, 41, [34]);
  wallV(15, 23, 34, [29]);
  wallV(27, 23, 34, [29]);
  // meeting rooms split
  wallH(29, 2, 14, [4, 13]);

  // open-plan desks: signals pile up on them
  const desks = (x0: number, x1: number) => {
    for (const y of [4, 7, 10]) {
      for (let x = x0; x <= x1; x += 2) {
        const t = at(x, y);
        t.shelter = 1;
        if (r() < 0.55) t.food = 1 + Math.floor(r() * 4);
      }
    }
  };
  desks(3, 13);
  desks(29, 39);
  // lab: rows of server racks holding benchmark data
  for (const y of [26, 29, 32]) {
    for (let x = 30; x <= 39; x++) {
      if (x === 34 || x === 35) continue;
      const t = at(x, y);
      t.shelter = 1;
      t.wood = 3 + Math.floor(r() * 5);
    }
  }
  // meeting rooms and whiteboards
  for (const m of HUTS) at(m.x, m.y).shelter = m.level;
  // lounge coffee machines
  for (const c of COFFEE) at(c.x, c.y).shelter = 1;
  // a few fresh signals in the atrium and patio (news, papers left around)
  for (const t of tiles) if ((t.biome === 'garden' || t.biome === 'plaza') && t.shelter === 0 && r() < 0.03) t.food = 1 + Math.floor(r() * 2);
  // idea board in the atrium
  Object.assign(at(STOCKPILE.x, STOCKPILE.y), { wood: 4, food: 0 });
  return { w, h, tiles };
}
