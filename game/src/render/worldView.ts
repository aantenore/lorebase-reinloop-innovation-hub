import Phaser from 'phaser';
import { config } from '../config';
import type { Season, Tile } from '../net/protocol';
import type { Store } from '../state/store';
import { depthOf, TILE_H, TILE_SIDE, toScreen } from './iso';
import { hash } from './palette';
import { CAMPUS_BIOMES, TILE_VARIANTS, tileKey, WATER_FRAMES } from './textures';

interface TileProps {
  objs: Phaser.GameObjects.GameObject[];
  hadBush: boolean;
}

/** Ground tiles and the props standing on them (trees, bushes, huts, fires...). */
export class WorldView {
  private tileImgs: Phaser.GameObjects.Image[] = [];
  private props: TileProps[] = [];
  private waterFrame = 0;
  private waterTimer = 0;
  private rackFrame = 0;
  private rackTimer = 0;
  private racks: Phaser.GameObjects.Image[] = [];
  private season: Season = 'spring';
  /** Campfire positions (screen space) for lights and smoke. */
  fires: { x: number; y: number; sprite: Phaser.GameObjects.Sprite; kind?: 'fire' | 'coffee' }[] = [];
  /** Lit windows (screen space). */
  windows: { x: number; y: number; tile: Tile }[] = [];
  /** Tall props that can hide characters behind them. */
  occluders: Phaser.GameObjects.Image[] = [];
  onFiresChanged: () => void = () => {};

  constructor(private scene: Phaser.Scene, private store: Store) {}

  build(): void {
    this.destroy();
    this.season = this.store.time.season;
    const { tiles } = this.store;
    for (const t of tiles) {
      const { sx, sy } = toScreen(t.x, t.y, t.elev);
      const img = this.scene.add.image(sx, sy, tileKey(t.biome, this.season, this.variant(t)), 0);
      img.setOrigin(0.5, TILE_H / 2 / (TILE_H + TILE_SIDE));
      img.setDepth(depthOf(t.x, t.y, -6));
      this.tileImgs.push(img);
    }
    this.props = tiles.map((t) => ({ objs: [], hadBush: t.food > 0 }));
    for (const t of tiles) this.buildProps(t);
    this.onFiresChanged();
  }

  destroy(): void {
    this.tileImgs.forEach((i) => i.destroy());
    this.tileImgs = [];
    this.props.forEach((p) => p.objs.forEach((o) => o.destroy()));
    this.props = [];
    this.fires = [];
    this.windows = [];
    this.occluders = [];
    this.racks = [];
  }

  private variant(t: Tile): number {
    return hash(`${t.x},${t.y}`) % TILE_VARIANTS;
  }

  private idx(t: Tile): number {
    return t.y * this.store.mapW + t.x;
  }

  /** Re-skin everything for a new season (snow, autumn leaves...). */
  setSeason(season: Season): void {
    if (season === this.season) return;
    this.season = season;
    for (const t of this.store.tiles) {
      this.tileImgs[this.idx(t)]?.setTexture(tileKey(t.biome, season, this.variant(t)), t.biome === 'water' ? this.waterFrame : 0);
      this.buildProps(t);
    }
    this.onFiresChanged();
  }

  updateTile(t: Tile): void {
    this.buildProps(t);
    // a hut next door may have gained / lost a campfire
    const n = this.store.tileAt(t.x + 1, t.y + 1);
    if (n) this.buildProps(n);
    this.onFiresChanged();
  }

  private buildProps(t: Tile): void {
    const slot = this.props[this.idx(t)];
    if (!slot) return;
    slot.objs.forEach((o) => {
      this.occluders = this.occluders.filter((x) => x !== o);
      this.fires = this.fires.filter((f) => f.sprite !== o);
      this.racks = this.racks.filter((x) => x !== o);
      o.destroy();
    });
    slot.objs = [];
    this.windows = this.windows.filter((w) => w.tile !== t);
    if (t.food > 0) slot.hadBush = true;
    const look = this.season;
    const { sx, sy } = toScreen(t.x, t.y, t.elev);
    const h = hash(`${t.x}:${t.y}`);
    const add = (key: string, frame: number, dx: number, dy: number, bias = 2, occluder = false) => {
      const img = this.scene.add.image(sx + dx, sy + dy, key, frame).setOrigin(0.5, 1);
      img.setDepth(depthOf(t.x, t.y, bias));
      if ((h >>> 5) % 2 === 0 && key.startsWith('pine')) img.setFlipX(true);
      slot.objs.push(img);
      if (occluder) this.occluders.push(img);
      return img;
    };

    if (CAMPUS_BIOMES.includes(t.biome) && t.biome !== 'garden') {
      this.campusProps(t, h, sx, sy, add, slot);
      return;
    }
    if (t.biome === 'garden') {
      const m = h % 9;
      if (m === 0) add(`oak_${look}`, (h >>> 3) % 2, 0, 3, 2, true);
      else if (m === 3) add('bench', 0, 0, 5, 2);
      else if (m === 5) add('planter', 0, 0, 5, 2);
      return;
    }

    if (t.shelter === 2) {
      add(`hut_${look}`, 0, 0, 5, 4, true);
      this.windows.push({ x: sx + 6, y: sy - 9, tile: t });
    } else if (t.shelter === 1) {
      add(`tent_${look}`, 0, 0, 4, 4, true);
    }
    if (t.shelter === 0) {
      if (t.biome === 'forest' && t.wood > 0) {
        // display density only: a share of forest tiles shows trees, the rest low undergrowth
        const roll = ((h >>> 8) % 1000) / 1000;
        const kind = h % 3 === 0 ? 'oak' : 'pine';
        const fr = (h >>> 3) % 2;
        if (roll >= config.render.forestTreeShare) {
          add(`undergrowth_${look}`, (h >>> 6) % 3, ((h >>> 4) % 7) - 3, 5, 1);
        } else if (t.wood >= 5 && roll < config.render.forestTreeShare * config.render.forestPairShare) {
          add(`${kind}_${look}`, fr, -6, 0, 2, true);
          add(`${h % 2 ? 'pine' : 'oak'}_${look}`, 1 - fr, 6, 5, 3, true);
        } else {
          add(`${kind}_${look}`, fr, ((h >>> 4) % 5) - 2, 3, 2, true);
        }
      } else if (t.biome === 'rock' && h % 3 === 0) {
        add(`rocks_${look}`, 0, 0, 4);
      }
      if (t.biome !== 'forest' && t.biome !== 'water') {
        if (t.food > 0 || slot.hadBush) add(`bush_${look}`, t.food > 0 ? 0 : 1, 0, 4);
        if (t.wood > 0) add('woodpile', 0, t.food > 0 ? 7 : 0, 5, 3);
      }
      const back = this.store.tileAt(t.x - 1, t.y - 1);
      if (back?.shelter === 2 && t.biome !== 'water') {
        const fire = this.scene.add.sprite(sx, sy + 4, 'campfire', 0).setOrigin(0.5, 1).setDepth(depthOf(t.x, t.y, 2));
        fire.play('campfire');
        slot.objs.push(fire);
        this.fires.push({ x: sx, y: sy, sprite: fire });
      }
    }
  }

  /** Office campus furniture. Server racks blink (two frames), the coffee bar doubles as the warm light source. */
  private campusProps(
    t: Tile,
    h: number,
    sx: number,
    sy: number,
    add: (key: string, frame: number, dx: number, dy: number, bias?: number, occluder?: boolean) => Phaser.GameObjects.Image,
    slot: TileProps,
  ): void {
    switch (t.biome) {
      case 'office':
        if (t.shelter === 1) add('desk', t.food > 0 ? 1 : 0, 0, 7, 3);
        else if (h % 11 === 0) add('plant_small', 0, 0, 4, 2);
        else if (h % 13 === 1) add('office_chair', 0, 0, 4, 2);
        break;
      case 'meeting':
        if (t.shelter === 2) add('meeting_room', 0, 0, 9, 4, true);
        else if (t.shelter === 1) add('whiteboard', 0, 0, 6, 3, true);
        break;
      case 'lab':
        if (t.shelter === 1) {
          const r = add(t.wood > 0 ? 'rack_lit' : 'rack_dim', (this.rackFrame + h) % 2, 0, 6, 3, true);
          this.racks.push(r);
        } else if (h % 9 === 0) add('lab_screen', 0, 0, 6, 3);
        break;
      case 'lounge':
        if (t.shelter === 1) {
          const c = this.scene.add.sprite(sx, sy + 6, 'coffee', 0).setOrigin(0.5, 1).setDepth(depthOf(t.x, t.y, 3));
          slot.objs.push(c);
          this.fires.push({ x: sx, y: sy - 2, sprite: c, kind: 'coffee' });
        } else {
          const m = h % 12;
          if (m < 2) add('sofa', 0, 0, 5, 2);
          else if (m === 4 || m === 5) add('armchair', 0, 0, 5, 2);
          else if (m === 8) add('plant_big', 0, 0, 5, 3, true);
        }
        break;
      case 'wall': {
        const faces = h % 3 === 0 ? 3 : 1 + (h % 2);
        add('wall_block', faces, 0, 8, 4, true);
        if (faces & 1) this.windows.push({ x: sx - 8, y: sy - 8, tile: t });
        if (faces & 2) this.windows.push({ x: sx + 8, y: sy - 8, tile: t });
        break;
      }
      case 'plaza':
        if (t.wood > 0) add('idea_board', Math.min(3, Math.max(1, Math.ceil(t.wood / 3))) - 1, 0, 7, 3, true);
        else if (h % 14 === 0) add('planter', 0, 0, 5, 2);
        else if (h % 23 === 1) add('reception', 0, 0, 7, 3);
        break;
      default:
    }
  }

  update(dt: number): void {
    this.rackTimer += dt;
    if (this.rackTimer > 520) {
      this.rackTimer = 0;
      this.rackFrame = (this.rackFrame + 1) % 2;
      this.racks.forEach((r, i) => r.setFrame((this.rackFrame + i) % 2));
    }
    this.waterTimer += dt;
    if (this.waterTimer > 420) {
      this.waterTimer = 0;
      this.waterFrame = (this.waterFrame + 1) % WATER_FRAMES;
      if (this.season !== 'winter') {
        for (const t of this.store.tiles) {
          if (t.biome === 'water') this.tileImgs[this.idx(t)]?.setFrame(this.waterFrame);
        }
      }
    }
  }
}
