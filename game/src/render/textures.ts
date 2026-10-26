import type { Biome, Season } from '../net/protocol';
import { TILE_H, TILE_SIDE, TILE_W } from './iso';
import { P, rng } from './palette';
import { addStrip, makeCanvas, Pix } from './pixel';

/** Visual look of the land per season. */
export type Look = Season;
export const LOOKS: Look[] = ['spring', 'summer', 'autumn', 'winter'];
export const TILE_VARIANTS = 4;
export const WATER_FRAMES = 3;

export const tileKey = (biome: Biome, look: Look, v: number) => `tile_${biome}_${look}_${v}`;

const pick = <T,>(arr: T[], r: () => number): T => arr[Math.floor(r() * arr.length)];

// ------------------------------------------------------------------ tiles

/** Row half-width of the top diamond at row py (0..TILE_H-1). */
function halfWidth(py: number): number {
  return py < TILE_H / 2 ? (py + 1) * 2 : (TILE_H - py) * 2;
}

function inDiamond(x: number, y: number): boolean {
  if (y < 0 || y >= TILE_H) return false;
  const hw = halfWidth(y);
  return x >= TILE_W / 2 - hw && x <= TILE_W / 2 + hw - 1;
}

function bottomOf(x: number): number {
  for (let y = TILE_H - 1; y >= 0; y--) if (inDiamond(x, y)) return y;
  return TILE_H / 2;
}

interface TopStyle {
  base: string[];
  side: [string, string];
  rim?: string;
  sideTop?: [string, string];
}

function topStyle(biome: Biome, look: Look): TopStyle {
  const winter = look === 'winter';
  switch (biome) {
    case 'grass':
      return {
        base: winter ? [P.snow[0], P.snow[1], P.snow[0], P.snow[3]] : look === 'autumn' ? P.grassAutumn : P.grass,
        side: [P.dirt[1], P.dirt[2]],
        sideTop: winter ? [P.snow[3], P.snow[4]] : look === 'autumn' ? [P.grassAutumn[0], '#6f7a38'] : [P.grass[0], P.grassDark],
      };
    case 'forest':
      return {
        base: winter ? [P.snow[0], P.snow[3], P.snow[0], P.snow[1]] : P.forestFloor,
        side: [P.dirt[2], P.dirt[3]],
        sideTop: winter ? [P.snow[3], P.snow[4]] : [P.forestFloor[0], '#244a2c'],
      };
    case 'sand':
      return {
        base: winter ? [P.snow[1], P.snow[0], P.sand[0], P.snow[3]] : P.sand,
        side: [P.sand[3], '#a8844f'],
      };
    case 'rock':
      return {
        base: winter ? [P.snow[0], P.rock[1], P.snow[3], P.rock[2]] : [P.rock[0], P.rock[1], P.rock[2], P.rock[0]],
        side: [P.rock[3], P.rock[4]],
      };
    case 'office':
      return { base: P.carpet, side: [P.concrete[3], P.concrete[4]] };
    case 'meeting':
      return { base: P.parquet, side: [P.parquet[3], '#6e4a2c'] };
    case 'lab':
      return { base: P.graphite, side: [P.graphite[3], '#1c2029'] };
    case 'lounge':
      return { base: P.terracotta, side: [P.terracotta[3], '#7a3a2a'] };
    case 'wall':
      return { base: [P.concrete[0], P.concrete[1], P.concrete[2], P.concrete[0]], side: [P.concrete[3], P.concrete[4]] };
    case 'garden':
      return {
        base: winter ? [P.snow[0], P.snow[1], P.snow[0], P.snow[3]] : look === 'autumn' ? P.grassAutumn : P.grass,
        side: [P.dirt[1], P.dirt[2]],
        sideTop: winter ? [P.snow[3], P.snow[4]] : look === 'autumn' ? [P.grassAutumn[0], '#6f7a38'] : [P.grass[0], P.grassDark],
      };
    case 'plaza':
      return { base: P.marble, side: [P.marble[3], '#9a98ac'] };
    case 'water':
      return {
        base: winter ? P.ice : [P.water[1], P.water[1], P.water[2], P.water[0]],
        side: winter ? [P.ice[3], '#6f9cbd'] : [P.water[0], '#244f96'],
      };
  }
}

export const CAMPUS_BIOMES: Biome[] = ['office', 'meeting', 'lab', 'lounge', 'wall', 'garden', 'plaza'];

/** Tile-axis coordinates (0..1 each) of a pixel inside the top diamond. */
function axes(x: number, y: number): { u: number; v: number } {
  const nx = (x + 0.5) / TILE_W;
  const ny = (y + 0.5) / TILE_H;
  return { u: nx + ny - 0.5, v: nx - ny + 0.5 };
}
const fract = (n: number) => n - Math.floor(n);

/** Floor surface patterns of the office campus (carpet seams, parquet planks, cable grid, rug, marble). */
function floorPattern(p: Pix, biome: Biome, variant: number, r: () => number): void {
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      if (!inDiamond(x, y)) continue;
      const { u, v } = axes(x, y);
      switch (biome) {
        case 'office':
          if (fract(u * 2) < 0.06 || fract(v * 2) < 0.06) p.set(x, y, P.carpet[3]);
          break;
        case 'meeting': {
          const idx = Math.floor(v * 5);
          const seam = fract(v * 5) < 0.14 || fract(u * 2.5 + idx * 0.37) < 0.07;
          p.set(x, y, seam ? P.parquet[3] : P.parquet[(idx * 2 + variant) % 3]);
          break;
        }
        case 'lab': {
          const line = fract(u * 2) < 0.07 || fract(v * 2) < 0.07;
          if (line) p.set(x, y, fract(u * 2) < 0.07 && fract(v * 2) < 0.07 ? P.cyan[0] : P.cyan[1]);
          break;
        }
        case 'lounge': {
          const inRug = variant < 2 && u > 0.12 && u < 0.88 && v > 0.12 && v < 0.88;
          if (inRug) {
            const edge = u < 0.22 || u > 0.78 || v < 0.22 || v > 0.78;
            p.set(x, y, edge ? P.rug[1] : (x + y) % 5 === 0 ? P.rug[2] : P.rug[0]);
          } else if (fract(u * 2) < 0.05 || fract(v * 2) < 0.05) p.set(x, y, P.terracotta[3]);
          break;
        }
        case 'plaza': {
          const dark = (Math.floor(u * 2) + Math.floor(v * 2)) % 2 === 0;
          p.set(x, y, dark ? P.marble[0] : P.marble[1]);
          if (r() < 0.04) p.set(x, y, P.marble[3]);
          break;
        }
        default:
      }
    }
  }
}

function drawTile(biome: Biome, look: Look, variant: number, frame: number): Pix {
  const p = new Pix(TILE_W, TILE_H + TILE_SIDE);
  const r = rng(variant * 7919 + biome.length * 104729 + LOOKS.indexOf(look) * 31);
  const campus = CAMPUS_BIOMES.includes(biome) && biome !== 'garden';
  if (campus) look = 'spring';
  const st = topStyle(biome, look);
  const winter = look === 'winter';

  // Top surface: clustered noise so it reads as texture, not static.
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      if (!inDiamond(x, y)) continue;
      const n = (Math.sin(x * 0.9 + variant * 3) + Math.cos(y * 1.3 + x * 0.4 + variant)) * 0.25 + r() * 0.6;
      const idx = n < 0.15 ? 0 : n < 0.55 ? 1 : n < 0.8 ? 2 : 3;
      p.set(x, y, st.base[Math.min(idx, st.base.length - 1)]);
    }
  }

  if (campus) floorPattern(p, biome, variant, r);

  // Biome details.
  const spots = (count: number, fn: (x: number, y: number) => void) => {
    for (let i = 0; i < count; i++) {
      const x = 4 + Math.floor(r() * (TILE_W - 8));
      const y = 2 + Math.floor(r() * (TILE_H - 4));
      if (inDiamond(x, y) && inDiamond(x + 1, y + 1) && inDiamond(x - 1, y - 1)) fn(x, y);
    }
  };
  if ((biome === 'grass' || biome === 'garden') && !winter) {
    spots(4, (x, y) => {
      p.set(x, y, look === 'autumn' ? '#c0b860' : P.grass[3]);
      p.set(x - 1, y - 1, look === 'autumn' ? '#aab258' : P.grass[3]);
      p.set(x + 1, y - 1, look === 'autumn' ? '#aab258' : P.grass[2]);
    });
    if (look === 'spring' || (look === 'summer' && variant % 2 === 0))
      spots(look === 'spring' ? 3 : 1, (x, y) => p.set(x, y, pick([P.flowerY, P.flowerW, P.flowerP], r)));
    if (look === 'autumn') spots(3, (x, y) => p.set(x, y, pick(P.leafAutumn, r)));
  }
  if (biome === 'forest' && !winter) spots(5, (x, y) => p.set(x, y, look === 'autumn' ? pick(P.leafAutumn, r) : pick(['#2a4f30', P.dirt[2], '#4f8a4a'], r)));
  if (biome === 'sand') spots(4, (x, y) => p.set(x, y, pick([P.sand[3], P.stone[1], '#f5e3b8'], r)));
  if (biome === 'rock') {
    spots(2, (x, y) => {
      p.line(x - 2, y, x + 1, y + 1, P.rock[3]);
      p.set(x - 2, y - 1, P.rock[2]);
    });
    spots(3, (x, y) => p.set(x, y, P.rock[2]));
  }
  if (winter && (biome === 'grass' || biome === 'forest' || biome === 'garden')) spots(3, (x, y) => p.set(x, y, P.snow[4]));
  if (winter && (biome === 'grass' || biome === 'garden')) spots(1, (x, y) => (p.set(x, y, P.grass[0]), p.set(x + 1, y - 1, P.grass[1])));

  if (biome === 'water') {
    if (winter) {
      spots(2, (x, y) => p.line(x - 3, y, x + 2, y - 1, P.ice[3]));
      spots(3, (x, y) => p.set(x, y, P.white));
    } else {
      // Animated ripples: short horizontal highlights drifting with the frame.
      const rw = rng(variant * 13 + 5);
      for (let i = 0; i < 5; i++) {
        const bx = Math.floor(rw() * TILE_W);
        const by = 2 + Math.floor(rw() * (TILE_H - 4));
        const x = (bx + frame * 2) % TILE_W;
        const len = 2 + Math.floor(rw() * 3);
        for (let k = 0; k < len; k++) if (inDiamond(x + k, by)) p.set(x + k, by, k === 0 ? P.water[4] : P.water[3]);
      }
    }
  }

  // Bevel: soft light on the two top edges, so the grid is felt but not drawn.
  for (let y = 0; y < TILE_H / 2; y++) {
    const hw = halfWidth(y);
    const lx = TILE_W / 2 - hw;
    const rx = TILE_W / 2 + hw - 1;
    if (biome !== 'water' || winter) {
      p.set(lx, y, lighten(p.get(lx, y)));
      p.set(lx + 1, y, lighten(p.get(lx + 1, y)));
    }
    p.set(rx, y, lighten(p.get(rx, y), 0.06));
  }

  // Side walls (only visible where the neighbour in front is lower).
  for (let x = 0; x < TILE_W; x++) {
    const b = bottomOf(x);
    const left = x < TILE_W / 2;
    for (let k = 1; k <= TILE_SIDE; k++) {
      let c = left ? st.side[0] : st.side[1];
      if (st.sideTop && k <= 2) c = left ? st.sideTop[0] : st.sideTop[1];
      else if ((x * 7 + k * 3 + variant) % 11 === 0) c = darken(c, 0.12);
      else if (k > TILE_SIDE - 2) c = darken(c, 0.15);
      p.set(x, b + k, c);
    }
  }
  return p;
}

function shift(c: string | null, amt: number): string | null {
  if (!c) return c;
  const n = parseInt(c.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
export const lighten = (c: string | null, a = 0.1) => shift(c, a) as string;
export const darken = (c: string | null, a = 0.1) => shift(c, -a) as string;

// ------------------------------------------------------------------ props

function pine(look: Look, seed: number): Pix {
  const p = new Pix(22, 38);
  const r = rng(seed);
  const cx = 11;
  const autumn = look === 'autumn';
  const leaf = autumn ? [P.leaf[0], '#4f7a3a', P.leaf[1], '#7a9a4a'] : P.leaf;
  p.rect(cx - 1, 30, 3, 6, P.trunk[0]);
  p.set(cx + 1, 31, P.trunk[1]);
  p.set(cx + 1, 33, P.trunk[1]);
  const tiers = [
    { top: 2, h: 10, w: 6 },
    { top: 8, h: 11, w: 8 },
    { top: 15, h: 13, w: 10 },
  ];
  for (const t of tiers) {
    for (let j = 0; j < t.h; j++) {
      const hw = Math.round((j / (t.h - 1)) * t.w);
      for (let i = -hw; i <= hw; i++) {
        const side = i / Math.max(1, hw);
        let c = side < -0.35 ? leaf[2] : side > 0.4 ? leaf[0] : leaf[1];
        if (j === t.h - 1 && i > -hw + 1) c = leaf[0];
        if (r() < 0.07) c = leaf[3];
        p.set(cx + i, t.top + j, c);
      }
    }
    if (look === 'winter') {
      for (let j = 0; j < 3; j++) {
        const hw = Math.round((j / (t.h - 1)) * t.w);
        for (let i = -hw; i <= hw; i++) p.set(cx + i, t.top + j, j === 2 && i > 0 ? P.snow[3] : P.snow[1]);
      }
      p.set(cx - t.w + 1, t.top + t.h - 2, P.snow[1]);
      p.set(cx - t.w + 2, t.top + t.h - 2, P.snow[1]);
    }
  }
  p.outline(P.outline);
  return p;
}

function roundTree(look: Look, seed: number): Pix {
  const p = new Pix(24, 34);
  const r = rng(seed);
  const cx = 12;
  // trunk with a fork
  p.rect(cx - 1, 20, 3, 12, P.trunk[0]);
  p.set(cx + 1, 22, P.trunk[1]);
  p.set(cx + 1, 26, P.trunk[1]);
  p.set(cx - 1, 29, P.trunk[2]);
  if (look === 'winter') {
    p.line(cx, 20, cx - 6, 12, P.trunk[0]);
    p.line(cx, 21, cx + 6, 11, P.trunk[0]);
    p.line(cx, 20, cx + 1, 8, P.trunk[0]);
    p.line(cx - 4, 15, cx - 7, 15, P.trunk[0]);
    p.line(cx + 4, 15, cx + 8, 14, P.trunk[0]);
    for (const [x, y] of [[cx - 6, 11], [cx + 6, 10], [cx + 1, 7], [cx - 7, 14], [cx + 8, 13], [cx - 3, 15]]) p.set(x, y, P.snow[1]);
    p.outline(P.outline);
    return p;
  }
  const leaf = look === 'autumn' ? P.leafAutumn : P.leaf;
  const blob = (bx: number, by: number, rx: number, ry: number) =>
    p.ellipse(bx, by, rx, ry, (nx, ny) => {
      const l = -nx * 0.6 - ny * 0.8;
      let c = l > 0.55 ? leaf[3] : l > 0.05 ? leaf[2] : l > -0.5 ? leaf[1] : leaf[0];
      if (r() < 0.06) c = leaf[Math.max(0, leaf.indexOf(c) - 1)];
      return c;
    });
  blob(cx - 4, 15, 6, 5);
  blob(cx + 4, 15, 6, 5);
  blob(cx, 10, 8, 7);
  if (look === 'spring') for (let i = 0; i < 7; i++) p.set(cx - 7 + Math.floor(r() * 14), 5 + Math.floor(r() * 13), P.blossom);
  p.outline(P.outline);
  return p;
}

function bush(look: Look, full: boolean): Pix {
  const p = new Pix(16, 12);
  const r = rng(full ? 3 : 4);
  const leaf = look === 'autumn' ? [P.leafAutumn[0], P.leafAutumn[1], P.leafAutumn[2], P.leafAutumn[3]] : P.leaf;
  const shade = (nx: number, ny: number) => (-nx * 0.5 - ny > 0.3 ? leaf[2] : -nx * 0.5 - ny > -0.4 ? leaf[1] : leaf[0]);
  p.ellipse(5, 7, 4.5, 4, shade);
  p.ellipse(11, 7, 4.5, 4, shade);
  p.ellipse(8, 5, 5, 4, shade);
  if (look === 'winter') {
    p.ellipse(8, 3.5, 4.5, 1.6, P.snow[1]);
    p.set(3, 4, P.snow[1]);
    p.set(12, 4, P.snow[3]);
  }
  if (full) {
    for (let i = 0; i < 6; i++) {
      const x = 3 + Math.floor(r() * 10);
      const y = 4 + Math.floor(r() * 6);
      p.set(x, y, P.berry);
      p.set(x, y - 1 < 4 ? y : y - 1, p.get(x, y - 1) === P.berry ? P.berry : p.get(x, y - 1));
      p.set(x - 1, y, P.berryLight);
    }
  }
  p.outline(P.outline);
  return p;
}

/** Low forest undergrowth (ferns, saplings): reads as forest without hiding anyone. */
function undergrowth(look: Look, seed: number): Pix {
  const p = new Pix(18, 11);
  const r = rng(seed);
  const leaf = look === 'autumn' ? P.leafAutumn : P.leaf;
  const fronds = 4 + Math.floor(r() * 3);
  for (let i = 0; i < fronds; i++) {
    const bx = 3 + Math.floor(r() * 12);
    const h = 4 + Math.floor(r() * 5);
    const lean = r() < 0.5 ? -1 : 1;
    for (let j = 0; j < h; j++) {
      const x = bx + Math.round((j / h) * lean * 2);
      const y = 10 - j;
      p.set(x, y, j > h - 3 ? leaf[3] : leaf[1 + (j % 2)]);
      if (j > 1 && j % 2 === 0) p.set(x - lean, y, leaf[0]);
    }
  }
  if (seed % 2 === 0) {
    p.rect(8, 7, 1, 4, P.trunk[0]);
    p.ellipse(8.5, 5, 3, 2.6, (nx, ny) => (-nx - ny > 0 ? leaf[2] : leaf[1]));
  }
  if (look === 'winter') for (let x = 2; x < 16; x++) if (p.get(x, 10) || p.get(x, 9)) p.set(x, 10, P.snow[1]);
  p.outline(P.outline);
  return p;
}

function rockPile(look: Look): Pix {
  const p = new Pix(18, 12);
  const shade = (nx: number, ny: number) => (-nx * 0.5 - ny > 0.4 ? P.rock[2] : -nx * 0.5 - ny > -0.3 ? P.rock[1] : P.rock[3]);
  p.ellipse(6, 7, 5, 4, shade);
  p.ellipse(12, 8, 4.5, 3.5, shade);
  p.ellipse(9, 4.5, 3.5, 3, shade);
  if (look === 'winter') {
    p.ellipse(9, 2.6, 2.6, 1.2, P.snow[1]);
    p.ellipse(5, 4.2, 3, 1.1, P.snow[1]);
  }
  p.outline(P.outline);
  return p;
}

function woodPile(): Pix {
  const p = new Pix(16, 12);
  const logEnd = (x: number, y: number) => {
    p.ellipse(x, y, 2.2, 2.2, P.log[3]);
    p.set(Math.round(x - 0.5), Math.round(y - 0.5), P.log[2]);
  };
  p.rect(2, 6, 12, 4, P.log[0]);
  p.rect(2, 9, 12, 1, P.log[1]);
  p.rect(4, 2, 9, 4, P.log[0]);
  logEnd(2.5, 8);
  logEnd(6.5, 8);
  logEnd(4.5, 4);
  logEnd(8.5, 4);
  p.outline(P.outline);
  return p;
}

function tent(look: Look): Pix {
  const p = new Pix(28, 24);
  const cx = 14;
  for (let j = 0; j < 18; j++) {
    const hw = Math.round(j * 0.72) + 1;
    for (let i = -hw; i <= hw; i++) {
      let c = i < 0 ? P.hide[2] : P.hide[0];
      if (i === 0) c = P.hide[3];
      if (j % 6 === 4 && Math.abs(i) > 1) c = P.hide[1];
      p.set(cx + i, 4 + j, c);
    }
  }
  // door flap
  for (let j = 0; j < 7; j++) for (let i = -Math.floor(j / 2); i <= 0; i++) p.set(cx + i + 1, 15 + j, P.outlineSoft);
  p.line(cx - 1, 1, cx - 1, 5, P.log[1]);
  p.line(cx + 1, 1, cx + 2, 5, P.log[1]);
  if (look === 'winter') for (let j = 0; j < 6; j++) for (let i = -Math.round(j * 0.72); i <= Math.round(j * 0.72); i++) p.set(cx + i, 5 + j, j > 3 && i > 0 ? P.snow[3] : P.snow[1]);
  p.outline(P.outline);
  return p;
}

function hut(look: Look): Pix {
  const p = new Pix(34, 34);
  const cx = 17;
  // log walls (iso box front faces)
  for (let y = 18; y < 31; y++) {
    for (let x = 4; x < 30; x++) {
      const left = x < cx;
      const row = (y - 18) % 3;
      let c = left ? P.log[2] : P.log[0];
      if (row === 2) c = left ? P.log[0] : P.log[1];
      p.set(x, y + (left ? Math.floor((cx - x) / 2.6) - 4 : Math.floor((x - cx) / 2.6) - 4), c);
    }
  }
  // door
  p.rect(cx - 6, 20, 4, 7, P.outlineSoft);
  p.rect(cx - 6, 20, 4, 1, P.log[1]);
  // window
  p.rect(cx + 5, 19, 3, 3, '#ffd77a');
  p.set(cx + 6, 20, P.log[1]);
  // thatched roof cone
  const roof = look === 'winter' ? [P.snow[1], P.snow[0], P.snow[3], P.snow[4]] : P.thatch;
  for (let j = 0; j < 17; j++) {
    const hw = Math.round(j * 0.95) + 1;
    for (let i = -hw; i <= hw; i++) {
      let c = i < -2 ? roof[2] : i > 2 ? roof[1] : roof[0];
      if ((i + j * 3) % 7 === 0) c = roof[3];
      if (j === 16) c = roof[3];
      p.set(cx + i, 1 + j, c);
    }
  }
  p.set(cx, 0, P.log[1]);
  p.outline(P.outline);
  return p;
}

function campfire(frame: number): Pix {
  const p = new Pix(16, 20);
  const r = rng(frame * 17 + 1);
  // stones ring
  for (const [x, y] of [[2, 16], [5, 18], [10, 18], [13, 16], [4, 14], [11, 14]]) {
    p.ellipse(x, y, 1.6, 1.2, P.stone[1]);
    p.set(x, y + 1, P.stone[2]);
  }
  p.line(4, 16, 11, 13, P.log[0]);
  p.line(4, 13, 11, 16, P.log[2]);
  // flame
  const heights = [7, 9, 8];
  const h = heights[frame % 3];
  for (let j = 0; j < h; j++) {
    const hw = Math.max(0, Math.round((1 - j / h) * 3.4 + (r() - 0.5)));
    for (let i = -hw; i <= hw; i++) {
      const core = Math.abs(i) < hw - 1 && j < h - 3;
      p.set(8 + i + (j > h - 3 ? (frame % 2 ? 1 : -1) : 0), 14 - j, core ? (j < 3 ? P.fire[0] : P.fire[1]) : j > h - 3 ? P.fire[3] : P.fire[2]);
    }
  }
  return p;
}

// ------------------------------------------------------------------ campus props

/** Isometric cuboid: front corner bottom at (cx, baseY), half-width hw, height h. Returns the top-diamond centre y. */
function isoBox(p: Pix, cx: number, baseY: number, hw: number, h: number, top: string, left: string, right: string): number {
  const cy = baseY - h - hw / 2;
  for (let i = -hw; i < hw; i++) {
    const a = Math.abs(i + (i < 0 ? 0 : 0.5));
    const yf = Math.round(cy + (hw - a) / 2);
    const yb = Math.round(cy - (hw - a) / 2);
    for (let y = yb; y <= yf; y++) p.set(cx + i, y, y === yb ? lighten(top, 0.08) : top);
    for (let k = 1; k <= h; k++) p.set(cx + i, yf + k, i < 0 ? left : right);
    p.set(cx + i, yf + h, darken(i < 0 ? left : right, 0.14));
  }
  return cy;
}

function monitor(p: Pix, x: number, y: number, lit: boolean, chart: boolean): void {
  const m = P.metal;
  p.rect(x + 3, y + 7, 2, 2, m[1]);
  p.rect(x + 1, y + 9, 6, 1, m[3]);
  p.rect(x, y, 8, 7, m[3]);
  p.rect(x + 1, y + 1, 6, 5, lit ? P.screen[0] : '#2c3648');
  if (chart) {
    p.rect(x + 1, y + 5, 1, 1, P.screen[4]);
    p.rect(x + 3, y + 3, 1, 3, P.screen[1]);
    p.rect(x + 5, y + 2, 1, 4, P.screen[2]);
    p.set(x + 6, y + 1, P.screen[3]);
  } else {
    p.line(x + 1, y + 2, x + 5, y + 2, '#5a6a88');
    p.line(x + 1, y + 4, x + 4, y + 4, '#5a6a88');
  }
}

function chair(p: Pix, x: number, y: number, c = '#46506a'): void {
  p.rect(x, y, 5, 6, c);
  p.rect(x, y, 5, 1, lighten(c, 0.12));
  p.rect(x + 1, y + 6, 1, 3, P.metal[3]);
  p.rect(x + 3, y + 6, 1, 3, P.metal[3]);
}

function desk(signals: boolean): Pix {
  const p = new Pix(32, 34);
  chair(p, 21, 9, '#5a4a7a');
  const top = P.parquet[2];
  isoBox(p, 14, 31, 11, 6, top, P.parquet[0], P.parquet[3]);
  monitor(p, 9, 6, true, signals);
  p.rect(18, 20, 4, 2, P.white);
  if (signals) {
    p.rect(4, 17, 3, 3, P.sticky[0]);
    p.rect(8, 21, 3, 3, P.sticky[1]);
    p.rect(19, 4, 3, 3, P.sticky[2]);
    p.rect(1, 12, 3, 3, P.sticky[3]);
  }
  p.outline(P.outline);
  return p;
}

function meetingRoom(): Pix {
  const p = new Pix(36, 42);
  // wall screen at the back
  p.rect(7, 1, 22, 13, P.metal[3]);
  p.rect(8, 2, 20, 11, P.screen[0]);
  p.rect(10, 9, 3, 3, P.screen[4]);
  p.rect(14, 6, 3, 6, P.screen[1]);
  p.rect(18, 4, 3, 8, P.screen[2]);
  p.rect(22, 7, 3, 5, P.screen[3]);
  chair(p, 6, 16, '#46506a');
  chair(p, 25, 16, '#46506a');
  isoBox(p, 18, 36, 14, 6, P.parquet[2], P.parquet[0], P.parquet[3]);
  chair(p, 3, 26, '#5a4a7a');
  chair(p, 28, 26, '#5a4a7a');
  chair(p, 14, 33, '#46506a');
  p.rect(14, 24, 3, 2, P.white);
  p.rect(21, 25, 3, 2, P.white);
  p.outline(P.outline);
  return p;
}

function whiteboard(): Pix {
  const p = new Pix(22, 30);
  p.rect(1, 1, 20, 14, P.metal[1]);
  p.rect(2, 2, 18, 12, P.white);
  p.line(3, 4, 9, 4, '#3a74c9');
  p.line(3, 6, 12, 6, '#3a74c9');
  p.line(3, 8, 8, 10, '#d8344a');
  p.line(8, 10, 12, 8, '#d8344a');
  p.rect(13, 3, 3, 3, P.sticky[0]);
  p.rect(16, 7, 3, 3, P.sticky[1]);
  p.rect(13, 10, 3, 3, P.sticky[2]);
  p.rect(10, 15, 2, 9, P.metal[3]);
  p.line(4, 27, 10, 24, P.metal[3]);
  p.line(18, 27, 12, 24, P.metal[3]);
  p.rect(3, 27, 2, 2, P.metal[3]);
  p.rect(17, 27, 2, 2, P.metal[3]);
  p.outline(P.outline);
  return p;
}

/** Server rack; frame toggles the LED pattern, `lit` = data available (brighter, greener). */
function rack(frame: number, lit: boolean): Pix {
  const p = new Pix(18, 36);
  p.rect(2, 2, 14, 32, P.metal[3]);
  p.rect(2, 2, 14, 1, P.metal[0]);
  p.rect(3, 3, 12, 30, '#2a303e');
  for (let i = 0; i < 6; i++) {
    const y = 4 + i * 5;
    p.rect(3, y, 12, 4, i % 2 ? '#3a4254' : '#343b4c');
    p.rect(4, y + 1, 5, 1, P.metal[1]);
    for (let k = 0; k < 3; k++) {
      const on = (i + k + frame) % 2 === 0;
      const c = lit ? (on ? P.screen[4] : '#2a6a3a') : on ? '#8a5a2a' : '#3a3a44';
      p.set(11 + k, y + 1, c);
      p.set(11 + k, y + 2, lit && !on ? P.cyan[1] : '#2a303e');
    }
  }
  p.outline(P.outline);
  return p;
}

function labScreen(): Pix {
  const p = new Pix(28, 28);
  isoBox(p, 14, 25, 10, 5, P.graphite[2], P.graphite[0], P.graphite[3]);
  monitor(p, 5, 6, true, true);
  monitor(p, 15, 7, true, true);
  p.outline(P.outline);
  return p;
}

function sofa(): Pix {
  const p = new Pix(30, 20);
  const c = P.sofa;
  p.rect(3, 3, 24, 8, c[1]);
  p.rect(3, 3, 24, 1, c[2]);
  p.rect(1, 7, 4, 9, c[1]);
  p.rect(25, 7, 4, 9, c[1]);
  p.rect(5, 9, 20, 6, c[0]);
  p.rect(5, 9, 20, 1, c[2]);
  p.line(15, 10, 15, 15, c[1]);
  p.rect(3, 16, 2, 2, P.metal[3]);
  p.rect(25, 16, 2, 2, P.metal[3]);
  p.outline(P.outline);
  return p;
}

function armchair(): Pix {
  const p = new Pix(18, 20);
  const c = P.terracotta;
  p.rect(3, 2, 12, 8, c[3]);
  p.rect(1, 7, 3, 8, c[1]);
  p.rect(14, 7, 3, 8, c[1]);
  p.rect(4, 9, 10, 6, c[0]);
  p.rect(4, 9, 10, 1, c[2]);
  p.rect(3, 15, 2, 2, P.log[1]);
  p.rect(13, 15, 2, 2, P.log[1]);
  p.outline(P.outline);
  return p;
}

function potPlant(w: number, h: number, big: boolean): Pix {
  const p = new Pix(w, h);
  const cx = Math.floor(w / 2);
  const potH = big ? 7 : 5;
  const potW = big ? 5 : 3;
  p.rect(cx - potW, h - potH, potW * 2, potH, P.ceramic[2]);
  p.rect(cx - potW, h - potH, potW * 2, 1, P.terracotta[2]);
  p.rect(cx - potW, h - 1, potW * 2, 1, P.terracotta[3]);
  const r = rng(w * 7 + h);
  const leaves = big ? 7 : 3;
  for (let i = 0; i < leaves; i++) {
    const a = -1 + (2 * i) / Math.max(1, leaves - 1);
    const len = (big ? 12 : 5) + Math.floor(r() * (big ? 7 : 3));
    const x1 = cx + a * (big ? 8 : 4);
    p.line(cx, h - potH, x1, h - potH - len, P.leaf[0]);
    p.ellipse(x1, h - potH - len, big ? 3.2 : 2, big ? 2.6 : 1.6, (nx, ny) => (-nx - ny > 0.2 ? P.leaf[3] : P.leaf[1]));
  }
  p.outline(P.outline);
  return p;
}

function coffeeBar(): Pix {
  const p = new Pix(26, 30);
  isoBox(p, 13, 27, 10, 8, P.terracotta[2], P.parquet[3], '#5a3a26');
  // machine
  p.rect(7, 4, 10, 11, P.metal[3]);
  p.rect(7, 4, 10, 2, P.metal[1]);
  p.rect(9, 7, 6, 3, '#2a303e');
  p.set(14, 7, P.screen[3]);
  p.rect(11, 11, 2, 2, P.metal[0]);
  p.rect(10, 13, 4, 2, P.white);
  p.rect(9, 2, 6, 2, P.metal[1]);
  p.outline(P.outline);
  return p;
}

/** Tall block with glass panels on the visible faces; `faces` bit 1 = left, 2 = right. */
function wallBlock(faces: number): Pix {
  const hw = 16;
  const h = 24;
  const p = new Pix(32, h + 18);
  const baseY = h + 16;
  const cy = isoBox(p, hw, baseY, hw, h, P.concrete[2], P.concrete[1], P.concrete[3]);
  const glass = (i0: number, i1: number) => {
    for (let i = i0; i <= i1; i++) {
      const ty = Math.round(cy + (hw - Math.abs(i)) / 2);
      for (let k = 5; k <= h - 6; k++) {
        const edge = k === 5 || i === i0 || i === i1 || k === h - 6;
        p.set(hw + i, ty + k, edge ? P.metal[2] : k < 9 ? P.glass[2] : (k + i) % 6 === 0 ? P.glass[2] : P.glass[0]);
      }
    }
  };
  if (faces & 1) glass(-13, -4);
  if (faces & 2) glass(3, 12);
  p.outline(P.outline);
  return p;
}

function planterBox(): Pix {
  const p = new Pix(22, 18);
  isoBox(p, 11, 15, 8, 4, P.concrete[2], P.concrete[1], P.concrete[3]);
  for (let i = 0; i < 6; i++) p.ellipse(5 + i * 2.2, 5 + (i % 2), 2.4, 2.4, (nx, ny) => (-nx - ny > 0.2 ? P.leaf[3] : P.leaf[1]));
  p.set(8, 4, P.flowerY);
  p.set(14, 5, P.flowerP);
  p.outline(P.outline);
  return p;
}

function bench(): Pix {
  const p = new Pix(26, 16);
  p.rect(2, 2, 22, 3, P.log[2]);
  p.rect(2, 6, 22, 3, P.log[0]);
  p.rect(2, 9, 22, 1, P.log[1]);
  p.rect(3, 10, 2, 4, P.metal[3]);
  p.rect(21, 10, 2, 4, P.metal[3]);
  p.outline(P.outline);
  return p;
}

function receptionDesk(): Pix {
  const p = new Pix(32, 30);
  isoBox(p, 16, 27, 13, 10, P.marble[2], P.concrete[3], P.concrete[4]);
  p.rect(5, 20, 8, 2, P.parquet[0]);
  monitor(p, 12, 4, true, false);
  p.rect(21, 12, 4, 2, P.white);
  p.outline(P.outline);
  return p;
}

/** Kanban stand: `size` 1..3 sets the number of rows of sticky notes. */
function ideaBoard(size: number): Pix {
  const rows = Math.max(1, Math.min(3, size));
  const h = 12 + rows * 6;
  const p = new Pix(24, h + 14);
  p.rect(1, 1, 22, h, P.metal[3]);
  p.rect(2, 2, 20, h - 2, P.white);
  for (const x of [8, 14]) p.rect(x, 2, 1, h - 2, P.concrete[1]);
  for (let r2 = 0; r2 < rows; r2++) {
    for (let c = 0; c < 3; c++) {
      if ((r2 + c) % 3 === 2 && r2 > 0) continue;
      p.rect(3 + c * 6, 3 + r2 * 6, 4, 4, P.sticky[(r2 * 3 + c) % 4]);
    }
  }
  p.rect(11, h + 1, 2, 10, P.metal[3]);
  p.line(4, h + 13, 11, h + 10, P.metal[3]);
  p.line(19, h + 13, 12, h + 10, P.metal[3]);
  p.outline(P.outline);
  // fixed frame size (bottom-aligned) so the three sizes share one strip
  const out = new Pix(24, 44);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) out.set(x, 44 - p.h + y, p.get(x, y));
  return out;
}

/** Career rank badge: 1..4 chevrons (the fourth turns gold). */
export function ensureCareerBadge(scene: Phaser.Scene, step: number): string {
  const n = Math.max(1, Math.min(4, Math.round(step)));
  const key = `career_${n}`;
  if (scene.textures.exists(key)) return key;
  const h = 3 + n * 2;
  const p = new Pix(7, h);
  p.rect(0, 0, 7, h, P.badge[0]);
  p.rect(0, 0, 7, 1, P.badge[1]);
  p.rect(0, 0, 1, h, P.badge[1]);
  const c = n === 4 ? P.gold[0] : P.badge[2];
  for (let i = 0; i < n; i++) {
    const y = 2 + i * 2;
    p.set(3, y, c);
    p.set(2, y + 1, c);
    p.set(4, y + 1, c);
  }
  p.outline(P.outline);
  addStrip(scene, key, [p]);
  return key;
}

// ------------------------------------------------------------------ fx sprites

function glow(size: number, scene: Phaser.Scene, key: string) {
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  scene.textures.addCanvas(key, canvas);
}

function shadow(): Pix {
  const p = new Pix(16, 7);
  p.ellipse(8, 3.5, 7.5, 3.2, 'rgba(23,17,26,0.32)');
  p.ellipse(8, 3.5, 5, 2, 'rgba(23,17,26,0.42)');
  return p;
}

function ring(): Pix {
  const p = new Pix(22, 11);
  p.ellipse(11, 5.5, 10.5, 5, '#ffffff');
  p.ellipse(11, 5.5, 8.5, 3.6, 'rgba(255,255,255,0.18)');
  return p;
}

function crown(): Pix {
  const p = new Pix(11, 8);
  const g = P.gold;
  p.rect(1, 4, 9, 3, g[1]);
  p.rect(1, 4, 9, 1, g[0]);
  for (const x of [1, 5, 9]) p.rect(x, 1, 1, 3, g[0]);
  for (const x of [3, 7]) p.rect(x, 2, 1, 2, g[1]);
  p.set(5, 5, '#d8344a');
  p.set(2, 5, g[2]);
  p.set(1, 1, g[2]);
  p.outline(P.outline);
  return p;
}

function star(c: string[]): Pix {
  const p = new Pix(9, 9);
  const pts = ['....x....', '...xxx...', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '..xx.xx..', '.x.....x.'];
  pts.forEach((row, y) => [...row].forEach((ch, x) => ch === 'x' && p.set(x, y + 1, y < 3 ? c[0] : c[1])));
  p.set(4, 2, c[2]);
  p.outline(P.outline);
  return p;
}

function gem(c: string[]): Pix {
  const p = new Pix(7, 8);
  ['..x..', '.xxx.', 'xxxxx', '.xxx.', '..x..'].forEach((row, y) =>
    [...row].forEach((ch, x) => ch === 'x' && p.set(x + 1, y + 1, x < 2 ? c[2] : y < 2 ? c[0] : c[1])),
  );
  p.outline(P.outline);
  return p;
}

function thoughtFrames(): Pix[] {
  return [1, 2, 3].map((dots) => {
    const p = new Pix(18, 15);
    p.ellipse(9, 6, 8, 5.5, P.white);
    p.ellipse(4, 12.5, 1.6, 1.4, P.white);
    p.set(1, 14, P.white);
    for (let i = 0; i < dots; i++) p.rect(5 + i * 3, 6, 2, 2, P.outlineSoft);
    p.outline(P.outline);
    return p;
  });
}

function arrow(): Pix {
  const p = new Pix(9, 7);
  ['xxxxxxx', '.xxxxx.', '..xxx..', '...x...'].forEach((row, y) => [...row].forEach((ch, x) => ch === 'x' && p.set(x + 1, y + 1, y === 0 ? '#fff2a0' : '#ffd84a')));
  p.outline(P.outline);
  return p;
}

function snowflake(): Pix {
  const p = new Pix(3, 3);
  p.set(1, 0, P.white);
  p.set(0, 1, P.white);
  p.set(1, 1, '#ffffff');
  p.set(2, 1, P.white);
  p.set(1, 2, P.white);
  return p;
}

function dot(c: string, s = 2): Pix {
  const p = new Pix(s, s);
  p.rect(0, 0, s, s, c);
  return p;
}

function puff(): Pix {
  const p = new Pix(8, 8);
  p.ellipse(4, 4, 3.8, 3.8, '#cfc8d4');
  p.ellipse(3.4, 3.4, 2.2, 2.2, '#e8e2ec');
  return p;
}

function zzz(): Pix {
  const p = new Pix(6, 6);
  ['xxxx', '..x.', '.x..', 'xxxx'].forEach((row, y) => [...row].forEach((ch, x) => ch === 'x' && p.set(x + 1, y + 1, '#c9d8ff')));
  p.outline(P.outline);
  return p;
}

/** Group banner on a pole, cloth in the group colour, optional family stripe. Generated per colour on demand. */
export function ensureBanner(scene: Phaser.Scene, color: string, stripe?: string): string {
  const key = `banner_${color}${stripe ? `_${stripe}` : ''}`;
  if (scene.textures.exists(key)) return key;
  const p = new Pix(12, 22);
  p.rect(1, 1, 1, 20, P.log[1]);
  p.set(1, 0, P.gold[0]);
  for (let y = 2; y < 11; y++) {
    const w = y > 8 ? 9 - (y - 8) * 2 : 9;
    for (let x = 2; x < 2 + w; x++) p.set(x, y, x === 2 || y === 2 ? lighten(color, 0.12) : y > 6 && x > 7 ? darken(color, 0.12) : color);
  }
  p.set(5, 5, P.white);
  p.set(6, 5, P.white);
  p.set(5, 6, P.white);
  if (stripe) for (let x = 2; x < 11; x++) for (const y of [8, 9]) if (p.get(x, y)) p.set(x, y, y === 8 ? lighten(stripe, 0.1) : stripe);
  p.outline(P.outline);
  addStrip(scene, key, [p]);
  return key;
}

/** Small laurel pip for the most esteemed (white: tinted gold/silver/bronze by rank). */
export function ensureLaurel(scene: Phaser.Scene): string {
  const key = 'laurel';
  if (scene.textures.exists(key)) return key;
  const p = new Pix(11, 8);
  const rows = ['x.......x', 'xx.....xx', '.xx...xx.', '..xx.xx..', '...xxx...'];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === 'x' && p.set(x + 1, y + 1, x % 2 ? '#ffffff' : '#d8d8d8')));
  p.set(5, 6, '#ffffff');
  p.outline(P.outline);
  addStrip(scene, key, [p]);
  return key;
}

/** Generate every static texture once at boot. */
export function generateWorldTextures(scene: Phaser.Scene): void {
  const biomes: Biome[] = ['grass', 'forest', 'water', 'rock', 'sand', 'garden'];
  // Look-independent campus floors are drawn once and registered under every look.
  const fixed = CAMPUS_BIOMES.filter((b) => b !== 'garden');
  for (let v = 0; v < TILE_VARIANTS; v++) {
    for (const b of fixed) {
      const tile = drawTile(b, 'spring', v, 0);
      for (const look of LOOKS) addStrip(scene, tileKey(b, look, v), [tile]);
    }
  }
  for (const look of LOOKS) {
    for (const b of biomes) {
      for (let v = 0; v < TILE_VARIANTS; v++) {
        const frames = b === 'water' ? [0, 1, 2].map((f) => drawTile(b, look, v, f)) : [drawTile(b, look, v, 0)];
        addStrip(scene, tileKey(b, look, v), frames);
      }
    }
    addStrip(scene, `pine_${look}`, [pine(look, 11), pine(look, 12)]);
    addStrip(scene, `oak_${look}`, [roundTree(look, 21), roundTree(look, 22)]);
    addStrip(scene, `bush_${look}`, [bush(look, true), bush(look, false)]);
    addStrip(scene, `undergrowth_${look}`, [undergrowth(look, 31), undergrowth(look, 32), undergrowth(look, 33)]);
    addStrip(scene, `rocks_${look}`, [rockPile(look)]);
    addStrip(scene, `tent_${look}`, [tent(look)]);
    addStrip(scene, `hut_${look}`, [hut(look)]);
  }
  addStrip(scene, 'woodpile', [woodPile()]);
  addStrip(scene, 'desk', [desk(false), desk(true)]);
  addStrip(scene, 'meeting_room', [meetingRoom()]);
  addStrip(scene, 'whiteboard', [whiteboard()]);
  addStrip(scene, 'rack_dim', [rack(0, false), rack(1, false)]);
  addStrip(scene, 'rack_lit', [rack(0, true), rack(1, true)]);
  addStrip(scene, 'lab_screen', [labScreen()]);
  addStrip(scene, 'sofa', [sofa()]);
  addStrip(scene, 'armchair', [armchair()]);
  addStrip(scene, 'plant_big', [potPlant(20, 34, true)]);
  addStrip(scene, 'plant_small', [potPlant(10, 16, false)]);
  addStrip(scene, 'office_chair', [(() => { const c = new Pix(9, 10); chair(c, 2, 0); c.outline(P.outline); return c; })()]);
  addStrip(scene, 'coffee', [coffeeBar()]);
  addStrip(scene, 'wall_block', [0, 1, 2, 3].map(wallBlock));
  addStrip(scene, 'planter', [planterBox()]);
  addStrip(scene, 'bench', [bench()]);
  addStrip(scene, 'reception', [receptionDesk()]);
  addStrip(scene, 'idea_board', [1, 2, 3].map(ideaBoard));
  addStrip(scene, 'campfire', [0, 1, 2].map(campfire));
  addStrip(scene, 'shadow', [shadow()]);
  addStrip(scene, 'ring', [ring()]);
  addStrip(scene, 'tier_opus', [crown()]);
  addStrip(scene, 'tier_sonnet', [star(P.silver)]);
  addStrip(scene, 'tier_haiku', [gem(P.bronze)]);
  addStrip(scene, 'thought', thoughtFrames());
  addStrip(scene, 'arrow', [arrow()]);
  addStrip(scene, 'snowflake', [snowflake()]);
  addStrip(scene, 'spark', [dot('#fff2a0')]);
  addStrip(scene, 'ember', [dot('#ff9a3c')]);
  addStrip(scene, 'pixel', [dot('#ffffff', 1)]);
  addStrip(scene, 'puff', [puff()]);
  addStrip(scene, 'zzz', [zzz()]);
  glow(64, scene, 'glow');
}
