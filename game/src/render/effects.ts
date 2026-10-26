import Phaser from 'phaser';
import type { Quarter, Season } from '../net/protocol';

const TOP = 1e7;

/** Key colours of the day (minute -> multiply tint). */
const DAY_KEYS: [number, number][] = [
  [0, 0x343c78],
  [270, 0x343c78],
  [360, 0xd89aa8],
  [450, 0xfff0e0],
  [600, 0xffffff],
  [1020, 0xffffff],
  [1140, 0xffc08a],
  [1230, 0x9a6a9a],
  [1320, 0x3c4480],
  [1440, 0x343c78],
];
const SEASON_TINT: Record<Season, number> = {
  spring: 0xfff6fa,
  summer: 0xfffbe8,
  autumn: 0xfff0dc,
  winter: 0xe6eeff,
};

/** Quarter tint replaces the season tint on the campus: Q1 cool crisp, Q2 fresh, Q3 warm golden, Q4 amber muted. */
const QUARTER_TINT: Record<Quarter, number> = {
  Q1: 0xe6f0ff,
  Q2: 0xf2fff4,
  Q3: 0xffeccc,
  Q4: 0xf0dcc4,
};

function lerpColor(a: number, b: number, k: number): number {
  const ch = (c: number, s: number) => (c >> s) & 255;
  const mix = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * k);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}
function mulColor(a: number, b: number): number {
  const ch = (c: number, s: number) => (c >> s) & 255;
  const m = (s: number) => Math.round((ch(a, s) * ch(b, s)) / 255);
  return (m(16) << 16) | (m(8) << 8) | m(0);
}

/** Darkness 0..1 for a minute of the day. */
export function darknessAt(minute: number): number {
  const m = minute % 1440;
  if (m >= 480 && m <= 1080) return 0;
  if (m < 300 || m > 1290) return 1;
  if (m < 480) return 1 - (m - 300) / 180;
  return (m - 1080) / 210;
}

/** Day/night tint, season tint, fire lights, snow and smoke. */
export class Atmosphere {
  private overlay: Phaser.GameObjects.Rectangle;
  /** Freeze: cold multiply tint plus a light additive grey that desaturates. */
  private chill: Phaser.GameObjects.Rectangle;
  private mist: Phaser.GameObjects.Rectangle;
  private frost: Phaser.GameObjects.Particles.ParticleEmitter;
  private quarter: Quarter | undefined;
  private freeze = false;
  private frostZone = new Phaser.Geom.Rectangle(0, 0, 800, 400);
  private lights: Phaser.GameObjects.Image[] = [];
  private snow: Phaser.GameObjects.Particles.ParticleEmitter;
  private smoke: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private embers: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private minute = 600;
  private season: Season = 'spring';
  private flicker = 0;
  private snowZone = new Phaser.Geom.Rectangle(0, 0, 800, 400);

  constructor(private scene: Phaser.Scene) {
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0xffffff).setOrigin(0).setDepth(TOP).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.chill = scene.add.rectangle(0, 0, 10, 10, 0xb8c8e8, 0.35).setOrigin(0).setDepth(TOP).setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false);
    this.mist = scene.add.rectangle(0, 0, 10, 10, 0x8a929e, 0.1).setOrigin(0).setDepth(TOP).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.frost = scene.add.particles(0, 0, 'snowflake', {
      lifespan: 9000,
      speedY: { min: 6, max: 14 },
      speedX: { min: -4, max: 2 },
      scale: { min: 0.4, max: 0.8 },
      alpha: { start: 0.7, end: 0.3 },
      tint: 0xdfeaff,
      frequency: 140,
      quantity: 1,
      emitting: false,
      emitZone: { type: 'random', source: this.frostZone, quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    this.frost.setDepth(TOP + 2);
    this.snow = scene.add.particles(0, 0, 'snowflake', {
      lifespan: 6000,
      speedY: { min: 14, max: 28 },
      speedX: { min: -8, max: 4 },
      scale: { min: 0.5, max: 1 },
      alpha: { start: 0.95, end: 0.6 },
      frequency: 30,
      quantity: 2,
      emitting: false,
      emitZone: { type: 'random', source: this.snowZone, quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    this.snow.setDepth(TOP + 2);
  }

  setTime(minute: number, season: Season, quarter?: Quarter, freeze?: boolean): void {
    this.minute = minute;
    const fz = !!freeze;
    if (season !== this.season || quarter !== this.quarter) {
      this.season = season;
      this.quarter = quarter;
      if (season === 'winter' && !quarter) this.snow.start();
      else this.snow.stop();
    }
    if (fz !== this.freeze) {
      this.freeze = fz;
      this.chill.setVisible(fz);
      this.mist.setVisible(fz);
      if (fz) this.frost.start();
      else this.frost.stop();
    }
  }

  /** Rebuild lights and smoke for the current fires and lit windows. */
  setLights(fires: { x: number; y: number; kind?: 'fire' | 'coffee' }[], windows: { x: number; y: number }[]): void {
    this.lights.forEach((l) => l.destroy());
    this.smoke.forEach((s) => s.destroy());
    this.embers.forEach((s) => s.destroy());
    this.lights = [];
    this.smoke = [];
    this.embers = [];
    for (const f of fires) {
      const coffee = f.kind === 'coffee';
      const l = this.scene.add.image(f.x, f.y - 4, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(coffee ? 0xffc878 : 0xffa040).setDepth(TOP + 1);
      l.setData('base', coffee ? 1.5 : 2.4);
      this.lights.push(l);
      if (coffee) {
        // steam instead of smoke and embers
        const steam = this.scene.add.particles(f.x, f.y - 12, 'puff', {
          lifespan: 1700,
          speedY: { min: -12, max: -7 },
          speedX: { min: -2, max: 2 },
          scale: { start: 0.25, end: 0.7 },
          alpha: { start: 0.5, end: 0 },
          tint: 0xffffff,
          frequency: 260,
        });
        steam.setDepth(TOP - 2);
        this.smoke.push(steam);
        continue;
      }
      const smoke = this.scene.add.particles(f.x, f.y - 14, 'puff', {
        lifespan: 2600,
        speedY: { min: -14, max: -9 },
        speedX: { min: -2, max: 5 },
        scale: { start: 0.45, end: 1.2 },
        alpha: { start: 0.55, end: 0 },
        frequency: 380,
      });
      smoke.setDepth(TOP - 2);
      this.smoke.push(smoke);
      const embers = this.scene.add.particles(f.x, f.y - 8, 'ember', {
        lifespan: 900,
        speedY: { min: -26, max: -12 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.6, end: 0 },
        frequency: 260,
        blendMode: Phaser.BlendModes.ADD,
      });
      embers.setDepth(TOP + 1);
      this.embers.push(embers);
    }
    for (const w of windows) {
      const l = this.scene.add.image(w.x, w.y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc860).setDepth(TOP + 1);
      l.setData('base', 0.4);
      this.lights.push(l);
    }
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, dt: number): void {
    const v = cam.worldView;
    const pad = 40;
    this.overlay.setPosition(v.x - pad, v.y - pad).setSize(v.width + pad * 2, v.height + pad * 2);
    const m = this.minute % 1440;
    let i = 0;
    while (i < DAY_KEYS.length - 2 && DAY_KEYS[i + 1][0] <= m) i++;
    const [m0, c0] = DAY_KEYS[i];
    const [m1, c1] = DAY_KEYS[i + 1];
    const day = lerpColor(c0, c1, (m - m0) / Math.max(1, m1 - m0));
    this.overlay.setFillStyle(mulColor(day, this.quarter ? QUARTER_TINT[this.quarter] : SEASON_TINT[this.season]));

    const dark = darknessAt(m);
    this.flicker += dt;
    for (const l of this.lights) {
      const base = l.getData('base') as number;
      const f = 1 + Math.sin(this.flicker / 90 + l.x) * 0.04 + Math.sin(this.flicker / 37 + l.y) * 0.03;
      l.setScale(base * f);
      l.setAlpha(base > 1 ? 0.08 + dark * 0.6 : dark * 0.55);
    }
    this.embers.forEach((e) => e.setAlpha(0.3 + dark * 0.7));

    if (this.freeze) {
      for (const r of [this.chill, this.mist]) r.setPosition(v.x - pad, v.y - pad).setSize(v.width + pad * 2, v.height + pad * 2);
      this.frost.setPosition(v.x - 40, v.y - 30);
      this.frostZone.setSize(v.width + 80, v.height * 0.6);
    }
    if (this.season === 'winter' && !this.quarter) {
      // spawn band follows the camera; flakes then live in world space
      this.snow.setPosition(v.x - 40, v.y - 30);
      this.snowZone.setSize(v.width + 80, v.height * 0.6);
    }
  }
}

/** One-shot puff of dust/sparkles at a world point. */
export function burst(scene: Phaser.Scene, x: number, y: number, kind: 'build' | 'birth' | 'death' | 'act'): void {
  const tex = kind === 'build' || kind === 'act' ? 'puff' : 'spark';
  const em = scene.add.particles(x, y, tex, {
    lifespan: kind === 'act' ? 500 : 900,
    speed: { min: 10, max: kind === 'act' ? 22 : 40 },
    angle: { min: 180, max: 360 },
    scale: { start: kind === 'act' ? 0.35 : 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: kind === 'death' ? 0x9a9aaa : kind === 'birth' ? 0xfff2a0 : 0xffffff,
    emitting: false,
  });
  em.setDepth(TOP - 1);
  em.explode(kind === 'act' ? 5 : 16);
  scene.time.delayedCall(1200, () => em.destroy());
}
