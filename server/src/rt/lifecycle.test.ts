import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../config.ts';
import { loadTemplates, translator } from '../i18n.ts';
import { ROOT } from '../config.ts';
import { canAddAgentMind, childSpec } from './births.ts';
import { loadGameConfig } from './config.ts';
import { lastHeard } from './decide.ts';
import { Game } from './game.ts';
import { recipeFrom, resourceFrom } from './economy.ts';
import { bodyBlock, pendingBlock, proclamation, recalledBlock, recipesBlock, textLanguage } from './prompt.ts';
import { type RtEntity, RtWorld } from './world.ts';

const game = loadGameConfig({});
const t = translator(loadTemplates(ROOT, 'it'));
/** The legacy terrain (value noise with resource sectors), kept by the engine for the noise layout. */
const NOISE_MAP = {
  layout: 'noise' as const, width: 40, height: 30, noiseScale: 6, waterBelow: 0.26, sandBelow: 0.32, rockAbove: 0.8, forestAbove: 0.56, elevationSteps: 4,
  capacity: { grass: { food: 6, wood: 0 }, forest: { food: 2, wood: 8 }, sand: { food: 1, wood: 0 }, water: { food: 0, wood: 0 }, rock: { food: 0, wood: 1 } },
  blocked: ['water', 'rock'], initialFill: [0.5, 1] as [number, number], spawnRadius: 3, spawnFood: { radius: 6, fill: 1, minFood: 3 },
  regions: { coreRadius: 5, minTiles: 6, rotations: 24, sectors: [{ name: 'sabbie', items: ['flint', 'clay'] }, { name: 'prati', items: ['fiber', 'seeds'] }, { name: 'boschi', items: ['herbs', 'seeds'] }, { name: 'rive', items: ['herbs', 'clay'] }] },
  maxPopulation: 40,
};

test('childSpec: tier of a random parent, crowd children of crowds, cap blocks or makes crowd', () => {
  const cfg = { ...game, births: { maxAgentMinds: 3, childTier: 'random-parent' as const, atCap: 'block' as const } };
  const opus = { tier: 'opus' as const, kind: 'agent' as const };
  const haiku = { tier: 'haiku' as const, kind: 'agent' as const };
  const extra = { tier: 'haiku' as const, kind: 'crowd' as const };
  assert.deepEqual(childSpec(cfg, opus, haiku, 2, () => 0.1), { tier: 'opus', kind: 'agent' });
  assert.deepEqual(childSpec(cfg, opus, haiku, 2, () => 0.9), { tier: 'haiku', kind: 'agent' });
  assert.deepEqual(childSpec(cfg, opus, extra, 2, () => 0.9), { tier: 'opus', kind: 'agent' });
  assert.deepEqual(childSpec(cfg, extra, extra, 99, () => 0.5), { tier: game.crowd.tier, kind: 'crowd' });
  assert.equal(childSpec(cfg, opus, haiku, 3, () => 0.1), undefined);
  assert.deepEqual(childSpec({ ...cfg, births: { ...cfg.births, atCap: 'crowd' } }, opus, haiku, 3, () => 0.1), { tier: game.crowd.tier, kind: 'crowd' });
  assert.deepEqual(childSpec({ ...cfg, births: { ...cfg.births, childTier: 'sonnet' } }, opus, haiku, 0, () => 0.1), { tier: 'sonnet', kind: 'agent' });
  assert.equal(canAddAgentMind(cfg, 2), true);
  assert.equal(canAddAgentMind(cfg, 3), false);
});

test('proclamation carries the full text of the law; recalled memories form a block', () => {
  const text = "Prima di parlare a qualcuno bisogna dire 'Salve, fratello'";
  const born = proclamation(t, { key: 'obbligo_saluto', old: null, new: 1, text });
  assert.ok(born.includes(text) && born.includes('obbligo_saluto') && born.includes('1'), born);
  const gone = proclamation(t, { key: 'obbligo_saluto', old: 1, new: null, text });
  assert.ok(gone.includes(text) && gone !== born, gone);
  const changed = proclamation(t, { key: 'obbligo_saluto', old: 1, new: 2, text });
  assert.ok(changed.includes('2') && changed !== born && changed !== gone, changed);
  assert.equal(recalledBlock(t, []), '');
  assert.ok(recalledBlock(t, ['giorno 1: una legge']).includes('- giorno 1: una legge'));
});

test('lastHeard finds what the speaker last said to this person', () => {
  const inbox = [
    { from: 'a1', fromName: 'Ilse', to: 'a2', text: 'prima', day: 1, minute: 1 },
    { from: 'a3', fromName: 'Mara', to: 'all', text: 'altro', day: 1, minute: 2 },
    { from: 'a1', fromName: 'Ilse', to: 'a2', text: 'ultima', day: 1, minute: 3 },
  ];
  assert.equal(lastHeard({ inbox }, { id: 'a1' }), 'ultima');
  assert.equal(lastHeard({ inbox }, { id: 'zz' }), '');
});

test('a death frees the mind, the group and the private memory', async () => {
  const sim = loadConfig(['--mock'], {});
  const g = new Game(sim, { ...game, death: { forgetMemories: true, epitaph: false } });
  const forgot: Array<[string, unknown]> = [];
  const mnemo = g.mnemo as unknown as { forget: (a: string, o: unknown) => Promise<unknown>; list: () => Promise<unknown[]> };
  mnemo.forget = async (a, o) => {
    forgot.push([a, o]);
    return { memories: 3, conversations: 1, runs: 0 };
  };
  mnemo.list = async () => [];
  g.world.rules = new Proxy({}, { get: () => 1 }) as typeof g.world.rules;
  const e = g.world.spawn({ name: 'Mara Bianca', role: 'elder', tier: 'haiku', model: 'mock', kind: 'agent' });
  const internals = g as unknown as { awaken(e: unknown): void; minds: Map<string, { stop(): void }> };
  internals.awaken(e);
  assert.ok(internals.minds.has(e.id));
  e.alive = false;
  await g.release(e);
  assert.equal(internals.minds.has(e.id), false);
  assert.deepEqual(forgot, [['mara-bianca', { speaker: 'Mara Bianca', runAgent: e.id }]]);
  g.stopLoop();
});

test('regions: the core yields no listed material, each sector its own; body and recipes are perceived as facts', () => {
  const w = new RtWorld(NOISE_MAP, game.movement, 1337, 0, { namePool: [], memoryItems: 5, inboxItems: 5 });
  for (const d of [{ code: 'flint', source: 'biome', biomes: ['sand'] }, { code: 'fiber', source: 'biome', biomes: ['grass'] }, { code: 'herbs', source: 'biome', biomes: ['forest'] }]) {
    w.catalog.resources.set(d.code, resourceFrom(d));
  }
  w.catalog.recipes.set('rope', recipeFrom({ code: 'rope', name: 'Corda', inputs: { fiber: 3 }, outputs: { rope: 1 } }));
  const rg = NOISE_MAP.regions;
  const walk = w.tiles.filter((x) => w.walkable(x.x, x.y));
  for (const item of ['flint', 'fiber', 'herbs']) {
    const where = walk.filter((x) => w.canGatherAt(item, x));
    assert.ok(where.length >= rg.minTiles, item);
    assert.ok(where.every((x) => w.distanceFromCenter(x) > rg.coreRadius && rg.sectors[w.regionOf(x)!]!.items.includes(item)), item);
  }
  const e = { id: 'a1', role: 'crafter', inventory: { food: 0, wood: 0, fiber: 1 }, tools: [], hp: 8, hunger: 1 } as unknown as RtEntity;
  w.resetBody(e);
  w.clock += 60;
  e.hp = 7;
  (w as unknown as { logBody(e: RtEntity, c: string, n: number): void }).logBody(e, 'wild', -1);
  const limits = { ...game.decisions.perception };
  const body = bodyBlock(t, w, e, limits);
  assert.ok(body.includes('60') && body.includes('-1') && body.includes(t('rt.body.wild')), body);
  assert.ok(w.hasFelt(e, 'wild'));
  const recipes = recipesBlock(t, w, e, limits);
  assert.ok(recipes.includes('rope') && recipes.includes('2 Fibre') === false && recipes.includes('fiber'), recipes);
});

test('campus: walls block, every zone is reachable from the plaza through its doors, fixtures are desks', () => {
  const w = new RtWorld(game.map, game.movement, 1337, 0, { namePool: [], memoryItems: 5, inboxItems: 5 });
  const c = game.map.campus!;
  const centre = { x: Math.floor(w.width / 2), y: Math.floor(w.height / 2) };
  assert.equal(w.tile(centre.x, centre.y)!.biome, c.centerBiome);
  assert.ok(w.tiles.some((x) => x.biome === c.wallBiome) && w.tiles.filter((x) => x.biome === c.wallBiome).every((x) => !w.walkable(x.x, x.y)));
  for (const biome of new Set(c.zones)) {
    const inside = w.tiles.filter((x) => x.biome === biome);
    assert.ok(inside.length > 0, biome);
    const far = inside.sort((a, b) => w.distanceFromCenter(b) - w.distanceFromCenter(a))[0]!;
    assert.ok(w.path(centre, far), `${biome} reachable`);
  }
  assert.ok(w.tiles.some((x) => x.biome === 'meeting' && x.shelter === 2) && w.tiles.some((x) => x.biome === 'office' && x.shelter === 1));
  assert.ok(w.tiles.every((x) => x.shelter === 0 || w.walkable(x.x, x.y)));
});

test('words to a named person without an answer are perceived with how long ago; an answer clears them', () => {
  const w = new RtWorld(game.map, game.movement, 1337, 0, { namePool: [], memoryItems: 5, inboxItems: 5 });
  w.rules = { ...w.rules, speech_radius: 6 };
  const person = (id: string, name: string, x: number) => ({ id, name, x, y: 10, alive: true, inbox: [] }) as unknown as RtEntity;
  const irene = person('a1', 'Irene', 10);
  const giulia = person('a2', 'Giulia', 12);
  w.entities.set(irene.id, irene);
  w.entities.set(giulia.id, giulia);
  const limits = { ...game.decisions.perception };
  assert.ok(w.say(irene, 'Giulia', 'Mi mandi il segnale sul dolore utenti?').ok);
  w.clock += 10;
  assert.equal(pendingBlock(t, w, irene, limits), '');
  w.clock += 110;
  const block = pendingBlock(t, w, irene, limits);
  assert.ok(block.includes('Giulia') && block.includes('2 ore') && block.includes('segnale'), block);
  assert.equal(pendingBlock(t, w, giulia, limits), '');
  w.say(giulia, 'all', 'Ci sto lavorando.');
  assert.equal(pendingBlock(t, w, irene, limits), '');
});

test('the language of a reasoning summary is guessed from marker words', () => {
  const m = game.decisions.thoughtLanguage!;
  assert.equal(textLanguage('Devo ancora capire se la fattibilità è credibile, perché non ho fonti.', m.markers, m.minHits), 'it');
  assert.equal(textLanguage('I need to check the sources and the costs before this review is fair.', m.markers, m.minHits), 'en');
  assert.equal(textLanguage('ok', m.markers, m.minHits), undefined);
});
