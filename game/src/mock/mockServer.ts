import type {
  ClientMsg,
  Dir,
  Entity,
  Group,
  ItemBag,
  MapData,
  PlanStep,
  Rule,
  RuleChange,
  RuleCreateRequest,
  RuleEditRequest,
  RuleMode,
  RuleMutationResult,
  RuleValue,
  ServerMsg,
  Season,
  Quarter,
  Tile,
  ToolState,
  WorldTime,
} from '../net/protocol';
import type { ConnStatus, Transport } from '../net/transport';
import { rng } from '../render/palette';
import {
  AGENTS,
  ASSEMBLY_DECISION,
  CHATTER,
  CROWD_NAMES,
  DEFAULT_REPLY,
  GROUPS,
  MODELS,
  REPLIES,
  RULES,
  THOUGHTS,
} from './mockData';
import { GodLedger } from './mockGod';
import { consultFor, Minds } from './mockMinds';
import { CRAFTS, EconomyState, fmtBag, FIRE, FLOW_WINDOW, PERISHABLE, PRODUCE, RES_NAME, ROUTES, START_INVENTORY, START_TOOLS, TECHS, TOOL_ITEMS } from './mockEconomy';
import type { TechDef } from './mockEconomy';
import { BUILD_SITE, COFFEE, generateMap, HUTS, STOCKPILE, VILLAGE } from './mockMap';
import { IdeaPipeline } from './mockIdeas';
import { SocietySim } from './mockSociety';

const params = new URLSearchParams(location.search);
/** Simulation speed multiplier (`?mockSpeed=4`). */
const SPEED = Math.max(0.25, Number(params.get('mockSpeed') || 1));
const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
/** Garden look per quarter (the campus itself is season-independent). */
const QUARTER_LOOK: Record<Quarter, Season> = { Q1: 'winter', Q2: 'spring', Q3: 'summer', Q4: 'autumn' };
const START_QUARTER = (QUARTERS.find((q) => q === params.get('mockQuarter')) ?? 'Q3') as Quarter;
const TICK_MS = 100;
/** Game minutes per real second. */
const MINUTES_PER_SEC = 8;
/** Real seconds (at speed 1) before scripted events. */
const RULES_CHANGE_AT = 55;
const FREEZE_AT = 110;
/** Scripted people moments: a hire and a burnout. */
const HIRE_AT = 70;
const BURNOUT_AT = 125;
const BURNOUT_ID = 'a-bruno';
/** Real seconds between flows broadcasts, perishables spoiling, and the cap on one item in a bag. */
const FLOWS_EVERY = 10;
const SPOIL_EVERY: [number, number] = [20, 30];
const BAG_CAP = 8;
/** Real seconds before a proposal is merged, and the minimum gap between two deliberations of a group. */
const PROPOSAL_MERGE_SEC = 4;
const DELIBERATION_GAP_SEC = 20;
/** Real seconds between batched regrowth of a few berry tiles (`tiles`). */
const REGROW_EVERY = 15;
const REGROW_MAX_FOOD = 4;
const RULE_KEY_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;

type RuleOp =
  | { kind: 'create'; value: RuleValue; text?: string; category?: string; unit?: string }
  | { kind: 'patch'; value?: RuleValue; text?: string; category?: string; unit?: string }
  | { kind: 'remove' };

interface Actor extends Entity {
  steps: PlanStep[];
  current: number;
  stepT: number;
  path: { x: number; y: number }[];
  busyUntil: number;
  thinkingUntil: number;
  persona: string;
  vx: number;
  vy: number;
}

interface GroupStepRef {
  who: string;
  /** Index of the step in the member's own plan. */
  src: number;
  /** The member plan the step was taken from (replanning invalidates it). */
  plan: PlanStep[];
  done: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** In-browser world that speaks the real protocol, so the client can be demoed offline. */
export class MockServer implements Transport {
  readonly kind = 'mock' as const;
  private msgCbs: ((m: ServerMsg) => void)[] = [];
  private map: MapData;
  private tiles: Tile[];
  private actors = new Map<string, Actor>();
  private groups = new Map<string, Group>();
  private rules: Rule[] = RULES.map((r) => ({ ...r }));
  private time: WorldTime = { day: 1, minute: 7 * 60 + 30, season: QUARTER_LOOK[START_QUARTER], quarter: START_QUARTER, freeze: false };
  private lorebase = { connected: true, branch: 'main', revision: 'a3f9c1e' };
  private youId: string | null = null;
  private r = rng(42);
  private elapsed = 0;
  private timer: number;
  private chatterT = 4;
  private freezeDone = false;
  private hireDone = false;
  private burnoutDone = false;
  private rulesDone = false;
  private ideas: IdeaPipeline;
  private nextPlayer = 1;
  private groupProgress = new Map<string, { refs: GroupStepRef[]; current: number }>();
  private econ = new EconomyState();
  private minds: Minds;
  private flowsAt = FLOWS_EVERY;
  private spoilAt = SPOIL_EVERY[0];
  private god: GodLedger;
  private society: SocietySim;
  private regrowAt = REGROW_EVERY;

  constructor() {
    this.map = generateMap();
    this.tiles = this.map.tiles;
    this.groups = new Map(GROUPS.map((g) => [g.id, structuredClone(g)]));
    AGENTS.forEach((a, i) => {
      const spot = this.freeNear(VILLAGE.x + ((i % 4) - 2) * 2, VILLAGE.y + Math.floor(i / 4) * 3 - 1);
      this.actors.set(a.id, this.makeActor({ id: a.id, name: a.name, role: a.role, tier: a.tier, kind: 'agent', groupId: a.groupId, speed: a.speed, ...spot }, a.persona));
    });
    CROWD_NAMES.forEach((name, i) => {
      const spot = this.freeNear(VILLAGE.x - 3 + i * 2, VILLAGE.y + 3);
      this.actors.set(`c-${i}`, this.makeActor({ id: `c-${i}`, name, role: 'villager', tier: 'haiku', kind: 'crowd', groupId: 'g-crowd', speed: 1.1, ...spot }, ''));
    });
    this.society = new SocietySim({ emit: (m) => this.emit(m), r: () => this.r(), actors: () => [...this.actors.values()], speed: SPEED });
    for (const a of this.actors.values()) this.society.decorate(a);
    this.minds = new Minds(
      {
        emit: (m) => this.emit(m),
        r: () => this.r(),
        now: () => ({ day: this.time.day, minute: Math.floor(this.time.minute) }),
        agents: () => [...this.actors.values()].filter((a) => a.kind === 'agent').map((a) => ({ id: a.id, name: a.name, role: a.role })),
      },
      ['gatherer', 'woodcutter', 'builder', 'healer', 'scout', 'wanderer', 'chief', 'elder', 'hunter'],
    );
    for (const a of this.actors.values()) if (a.kind === 'agent') this.minds.seedAgent(a.id, a.role);
    this.god = new GodLedger({
      r: () => this.r(),
      now: () => ({ day: this.time.day, minute: Math.floor(this.time.minute) }),
      agent: (id) => this.actors.get(id),
      agentIds: () => [...this.actors.values()].filter((a) => a.kind === 'agent').map((a) => a.id),
      memories: (id) => this.minds.memories(id),
      revision: () => ({ branch: this.lorebase.branch, revision: this.lorebase.revision }),
      counts: () => {
        const ins = this.minds.insightList();
        const eco = this.econ.economy();
        return { rules: this.rules.length, insights: ins.stored.length + ins.pending.length, techs: eco.techs.length, recipes: eco.recipes.length };
      },
    });
    this.ideas = new IdeaPipeline({
      emit: (m) => this.emit(m),
      r: () => this.r(),
      now: () => ({ day: this.time.day, minute: Math.floor(this.time.minute) }),
      quarter: () => this.time.quarter ?? START_QUARTER,
      freeze: () => !!this.time.freeze,
      rule: (k) => this.rule(k),
      agents: () => [...this.actors.values()].filter((a) => a.kind === 'agent' && a.alive).map((a) => ({ id: a.id, name: a.name, role: a.role, groupId: a.groupId })),
      group: (id) => this.groups.get(id),
      speed: SPEED,
    });
    // stagger first plans so the opening already looks busy
    let k = 0;
    for (const a of this.actors.values()) {
      if (a.kind === 'agent') this.think(a, 'Inizia la giornata: quali segnali vale la pena seguire?', 0.3 + k++ * 0.35);
      else this.crowdPlan(a);
    }
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    setTimeout(() => this.groupPlans(), 3500);
  }

  // ------------------------------------------------------------ transport

  onMessage(cb: (msg: ServerMsg) => void): void {
    this.msgCbs.push(cb);
    // like a real socket: greet as soon as someone listens
    if (this.msgCbs.length === 1) setTimeout(() => this.hello(), 0);
  }
  onStatus(cb: (s: ConnStatus) => void): void {
    setTimeout(() => cb('mock'), 0);
  }
  close(): void {
    clearInterval(this.timer);
  }

  send(msg: ClientMsg): void {
    switch (msg.type) {
      case 'join':
        this.join(msg.name, msg.role);
        break;
      case 'input': {
        const p = this.youId ? this.actors.get(this.youId) : undefined;
        if (p) {
          p.vx = clamp(msg.dx, -1, 1);
          p.vy = clamp(msg.dy, -1, 1);
        }
        break;
      }
      case 'act':
        this.playerAct(msg.action, msg.args);
        break;
      case 'speak':
        this.reply(msg.to, msg.text);
        break;
    }
  }

  async postRule(req: RuleEditRequest): Promise<string | null> {
    if (!this.rules.some((r) => r.key === req.key)) return `legge sconosciuta: ${req.key}`;
    this.submitRule(req.key, { kind: 'patch', value: req.value }, req.mode, req.message);
    return null;
  }

  /** POST /rules, PATCH /rules/:key, DELETE /rules/:key?mode= */
  async request<T = unknown>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const [route, query = ''] = path.split('?');
    const q = new URLSearchParams(query);
    const m = /^\/rules(?:\/([^/]+))?$/.exec(route.replace(/^\/api(?=\/)/, ''));
    if (!m || (method === 'POST') === !!m[1]) throw new Error('404 not found');
    const b = (body ?? {}) as Partial<RuleCreateRequest>;
    const key = m[1] ? decodeURIComponent(m[1]) : String(b.key ?? '');
    const mode: RuleMode = (method === 'DELETE' ? q.get('mode') : b.mode) === 'proposal' ? 'proposal' : 'direct';
    const message = (method === 'DELETE' ? q.get('message') : b.message) || '';
    const exists = this.rules.some((r) => r.key === key);
    if (!RULE_KEY_RE.test(key)) throw new Error(`400 chiave non valida: ${key}`);
    if (method !== 'POST' && !exists) throw new Error(`404 legge sconosciuta: ${key}`);
    const op: RuleOp =
      method === 'DELETE'
        ? { kind: 'remove' }
        : exists
          ? { kind: 'patch', value: b.value, text: b.text, category: b.category, unit: b.unit }
          : { kind: 'create', value: b.value ?? '', text: b.text, category: b.category, unit: b.unit };
    return this.submitRule(key, op, mode, message) as T;
  }

  async getJson<T = unknown>(path: string): Promise<T> {
    const [route, query = ''] = path.split('?');
    const clean = route.replace(/^\/api(?=\/)/, '').replace(/\/+$/, '');
    const q = new URLSearchParams(query);
    let out: unknown;
    const mem = /^\/agents\/([^/]+)\/memories$/.exec(clean);
    const mind = /^\/agents\/([^/]+)\/mind$/.exec(clean);
    const idea = /^\/ideas\/([^/]+)$/.exec(clean);
    if (clean === '/ideas') out = { ideas: this.ideas.list() };
    else if (clean === '/company') out = this.ideas.company();
    else if (idea && idea[1] !== 'export.md') {
      out = this.ideas.get(decodeURIComponent(idea[1]));
      if (!out) return Promise.reject(new Error('404'));
    } else if (clean === '/society') out = this.society.society();
    else if (clean === '/economy') out = { ...this.econ.economy(), flows: this.econ.flows(this.elapsed) };
    else if (mem) {
      const memories = this.minds.memories(decodeURIComponent(mem[1]));
      if (!memories) return Promise.reject(new Error('404'));
      out = { memories };
    } else if (mind) {
      out = this.god.mind(decodeURIComponent(mind[1]));
      if (!out) return Promise.reject(new Error('404'));
    } else if (clean === '/conversations') out = this.god.conversations(q, this.groups);
    else if (clean === '/observatory/summary') out = this.god.summary();
    else if (clean === '/observatory/log') out = this.god.lorebaseLog(Number(q.get('limit') || 20));
    else if (clean === '/observatory/proposals') out = this.god.proposalList(q.get('status'));
    else if (clean === '/insights') out = this.minds.insightList(q.get('role') || undefined);
    else if (clean === '/consciousness') out = this.minds.consciousness();
    else return Promise.reject(new Error('404'));
    return structuredClone(out) as T;
  }

  private emit(msg: ServerMsg) {
    this.god?.observe(msg);
    for (const cb of this.msgCbs) cb(msg);
  }

  // ------------------------------------------------------------ setup helpers

  private makeActor(
    e: Pick<Entity, 'id' | 'name' | 'role' | 'tier' | 'kind' | 'groupId' | 'speed' | 'x' | 'y'>,
    persona: string,
  ): Actor {
    return {
      ...e,
      model: MODELS[e.tier],
      dir: 's',
      anim: 'idle',
      hp: 100,
      maxHp: 100,
      hunger: 15 + Math.floor(this.r() * 30),
      inventory: { food: e.kind === 'player' ? 1 : Math.floor(this.r() * 3), wood: 0, ...(e.kind === 'agent' ? START_INVENTORY[e.role] : {}) },
      tools: (START_TOOLS[e.id] ?? []).map((t) => ({ ...t })),
      alive: true,
      steps: [],
      current: 0,
      stepT: 0,
      path: [],
      busyUntil: 0,
      thinkingUntil: 0,
      persona,
      vx: 0,
      vy: 0,
    };
  }

  private tile(x: number, y: number): Tile | undefined {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.map.w || iy >= this.map.h) return undefined;
    return this.tiles[iy * this.map.w + ix];
  }

  private passable(x: number, y: number): boolean {
    const t = this.tile(x, y);
    return !!t && t.biome !== 'water' && t.biome !== 'wall' && t.elev < 3 && t.shelter === 0;
  }

  private freeNear(x: number, y: number): { x: number; y: number } {
    for (let r = 0; r < 8; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) if (this.passable(x + dx, y + dy)) return { x: x + dx, y: y + dy };
    return { x, y };
  }

  private findPath(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
    const w = this.map.w;
    const sx = Math.round(from.x);
    const sy = Math.round(from.y);
    const goal = this.passable(to.x, to.y) ? to : this.freeNear(to.x, to.y);
    const prev = new Map<number, number>();
    const start = sy * w + sx;
    const target = goal.y * w + goal.x;
    const q = [start];
    prev.set(start, -1);
    while (q.length) {
      const cur = q.shift()!;
      if (cur === target) break;
      const cx = cur % w;
      const cy = Math.floor(cur / w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        const id = ny * w + nx;
        if (prev.has(id) || !this.passable(nx, ny)) continue;
        prev.set(id, cur);
        q.push(id);
      }
    }
    if (!prev.has(target)) return [];
    const path: { x: number; y: number }[] = [];
    for (let c = target; c !== -1 && c !== start; c = prev.get(c)!) path.unshift({ x: c % w, y: Math.floor(c / w) });
    return path;
  }

  private nearest(a: Actor, pred: (t: Tile) => boolean, spread = 4): Tile | undefined {
    const cands = this.tiles.filter(pred);
    cands.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y));
    return cands[Math.floor(this.r() * Math.min(spread, cands.length))];
  }

  private rule(key: string): number {
    return Number(this.rules.find((r) => r.key === key)?.value ?? 0);
  }

  private snapshotEntity(a: Actor): Entity {
    const { steps: _s, current: _c, stepT: _t, path: _p, busyUntil: _b, thinkingUntil: _th, persona: _pe, vx: _vx, vy: _vy, ...e } = a;
    return e;
  }

  // ------------------------------------------------------------ protocol out

  private hello() {
    this.emit({
      type: 'hello',
      you: this.youId ? { entityId: this.youId } : null,
      map: { w: this.map.w, h: this.map.h, tiles: this.tiles.map((t) => ({ ...t })) },
      entities: [...this.actors.values()].map((a) => this.snapshotEntity(a)),
      groups: [...this.groups.values()],
      rules: this.rules,
      time: this.time,
      roles: ['visitor', 'researcher', 'analyst', 'engineer', 'designer'],
      lorebase: this.lorebase,
      economy: this.econ.economy(),
      society: this.society.society(),
      company: this.ideas.company(),
      ideas: this.ideas.list(),
    });
    this.emitFlows();
    this.society.replay();
    // replay current plans so a late joiner sees them
    for (const a of this.actors.values()) if (a.steps.length && a.kind === 'agent') this.sendPlan(a, 'Piano in corso');
    this.groupPlans();
  }

  private join(name: string, role: string) {
    const id = `p-${this.nextPlayer++}`;
    const spot = this.freeNear(VILLAGE.x + 1, VILLAGE.y + 1);
    const p = this.makeActor({ id, name: name || 'Ospite', role: role || 'visitor', tier: 'human', kind: 'player', groupId: null, speed: 2.4, ...spot }, '');
    this.actors.set(id, p);
    this.society.decorate(p);
    this.youId = id;
    this.hello();
    this.emit({ type: 'world_event', kind: 'birth', text: `${p.name} entra nell’hub come ospite.`, at: spot });
  }

  private sendPlan(a: Actor, reason: string) {
    this.emit({ type: 'plan', id: a.id, scope: 'entity', steps: a.steps, current: a.current, reason, createdAt: Date.now() });
  }

  // ------------------------------------------------------------ planning

  private think(a: Actor, reason: string, delaySec = 0) {
    a.steps = [];
    a.path = [];
    a.anim = 'idle';
    const dur = (1.2 + this.r() * 2 + (a.tier === 'opus' ? 1 : 0)) / SPEED + delaySec;
    a.thinkingUntil = this.elapsed + dur * SPEED + 0.5;
    setTimeout(() => this.emit({ type: 'thinking', id: a.id, on: true }), delaySec * 1000);
    if (a.kind === 'agent' && this.r() < 0.6) {
      const c = consultFor(a.role, () => this.r());
      setTimeout(() => this.emit({ type: 'consult', agentId: a.id, tool: c.tool, query: c.query }), delaySec * 1000 + (0.3 + this.r() * 0.6) * 1000 / SPEED);
    }
    setTimeout(() => {
      if (!this.actors.has(a.id)) return;
      this.emit({ type: 'thinking', id: a.id, on: false });
      a.steps = this.makePlan(a);
      a.current = 0;
      a.stepT = 0;
      this.sendPlan(a, reason);
      if (a.groupId) this.groupPlans(a.groupId);
      if (this.r() < 0.5) this.emit({ type: 'say', from: a.id, to: 'all', text: THOUGHTS[Math.floor(this.r() * THOUGHTS.length)], kind: 'thought' });
    }, dur * 1000);
  }

  private makePlan(a: Actor): PlanStep[] {
    const s: PlanStep[] = [];
    const walk = (t: { x: number; y: number }, label: string) => s.push({ action: 'walk_to', args: { x: t.x, y: t.y }, label });
    const night = this.time.minute > 20 * 60 || this.time.minute < 6 * 60;
    const coffee = () => {
      const c = COFFEE[Math.floor(this.r() * COFFEE.length)];
      walk(this.freeNear(c.x, c.y + 1), 'Va alla macchinetta del caffè');
      s.push({ action: 'eat', args: {}, label: 'Pausa caffè' });
    };
    if (night) {
      walk(this.freeNear(21 + Math.floor(this.r() * 5) - 2, 30 + Math.floor(this.r() * 3)), 'Stacca e va in lounge');
      s.push({ action: 'sleep', args: { s: 25 }, label: 'Ricarica fino al mattino' });
      return s;
    }
    if (a.hunger > 55) coffee();
    const role = a.role;
    const rounds = 4 + Math.floor(this.r() * 3);
    for (let i = 0; i < rounds; i++) {
      if (role === 'engineer' || (role === 'strategist' && i % 3 === 0) || (this.time.freeze && role === 'researcher' && i % 2 === 1)) {
        const rack = this.nearest(a, (t) => t.biome === 'lab' && t.wood > 0, 6);
        if (!rack) break;
        walk(this.freeNear(rack.x, rack.y + 1), 'Va in lab');
        s.push({ action: 'chop', args: { x: rack.x, y: rack.y }, label: 'Lancia un benchmark' });
        s.push({ action: 'chop', args: { x: rack.x, y: rack.y }, label: 'Raccoglie i risultati' });
        s.push({ action: 'carry_to', args: { ...STOCKPILE }, label: 'Appunta i dati sull’idea board' });
      } else if (role === 'designer') {
        walk(this.freeNear(STOCKPILE.x, STOCKPILE.y + 1), 'Legge l’idea board');
        s.push({ action: 'take', args: { ...STOCKPILE }, label: 'Prende i dati appuntati' });
        walk(this.freeNear(BUILD_SITE.x + 1, BUILD_SITE.y), 'Va in sala riunioni');
        s.push({ action: 'build', args: { ...BUILD_SITE }, label: 'Allestisce lo spazio di lavoro' });
        s.push({ action: 'wait', args: { s: 2 }, label: 'Rilegge il concept' });
      } else if (role === 'strategist' || role === 'critic') {
        const other = this.pickOther(a);
        if (other) {
          walk(this.freeNear(Math.round(other.x) + 1, Math.round(other.y)), `Raggiunge ${other.name}`);
          s.push({ action: 'say', args: { to: other.id, text: role === 'critic' ? 'Chi è l’utente, esattamente? Senza un nome l’idea non passa.' : 'Su cosa stai lavorando? Si lega ai temi del trimestre?' }, label: `Parla con ${other.name}` });
        }
        s.push({ action: 'wait', args: { s: 3 }, label: 'Osserva il portfolio' });
      } else {
        const desk = this.nearest(a, (t) => t.food > 0, 5);
        if (!desk) break;
        walk(this.freeNear(desk.x + 1, desk.y), 'Va verso una scrivania con segnali');
        s.push({ action: 'gather', args: { x: desk.x, y: desk.y }, label: 'Raccoglie segnali' });
        if (role === 'researcher' && i === 0) s.push({ action: 'say', args: { to: 'all', text: 'Qui c’è un segnale interessante!' }, label: 'Avvisa gli altri' });
      }
    }
    this.economyPlan(a, s, walk);
    walk(this.freeNear(VILLAGE.x + Math.floor(this.r() * 5) - 2, VILLAGE.y + Math.floor(this.r() * 5) - 2), 'Torna nell’atrio');
    if (a.hunger > 30) coffee();
    s.push({ action: 'wait', args: { s: 2 }, label: 'Riordina gli appunti' });
    return s;
  }

  /** Circular economy: produce raw goods, craft what the role knows, hand goods over to the roles that need them. */
  private economyPlan(a: Actor, s: PlanStep[], walk: (t: { x: number; y: number }, label: string) => void) {
    const prod = PRODUCE[a.role];
    if (prod) {
      const biome = a.role === 'engineer' ? 'lab' : a.role === 'researcher' ? 'garden' : a.role === 'designer' ? 'meeting' : 'office';
      const spot = this.nearest(a, (t) => t.biome === biome && t.shelter === 0, 6);
      if (spot) walk(this.freeNear(spot.x, spot.y + 1), prod.label);
      s.push({ action: 'produce', args: { items: prod.items }, label: prod.label });
    }
    for (const code of CRAFTS[a.role] ?? []) {
      const rec = this.econ.recipe(code);
      if (!rec) continue;
      if (rec.station === FIRE) walk(this.freeNear(HUTS[2].x + 1, HUTS[2].y), 'Va alla lavagna');
      s.push({ action: 'craft', args: { recipe: code }, label: `Fabbrica: ${rec.name}` });
    }
    for (const route of ROUTES[a.role] ?? []) {
      if (this.r() > route.p) continue;
      if (!this.econ.recipeKnownItem(Object.keys(route.give)[0])) continue;
      const to = this.pickRole(route.toRole, a);
      if (!to) continue;
      walk(this.freeNear(Math.round(to.x) + 1, Math.round(to.y)), `Raggiunge ${to.name}`);
      s.push({ action: 'give', args: { to: to.id, give: route.give, ...(route.get && this.r() < 0.5 ? { get: route.get } : {}) }, label: `${route.label} (${to.name})` });
    }
  }

  private pickRole(role: string, not: Actor): Actor | undefined {
    const list = [...this.actors.values()].filter((o) => o.kind === 'agent' && o.alive && o.role === role && o.id !== not.id);
    return list[Math.floor(this.r() * list.length)];
  }

  private crowdPlan(a: Actor) {
    const s: PlanStep[] = [];
    for (let i = 0; i < 4; i++) {
      const lounge = this.r() < 0.4;
      const target = lounge
        ? this.freeNear(21 + Math.floor(this.r() * 9) - 4, 30 + Math.floor(this.r() * 5) - 2)
        : this.freeNear(VILLAGE.x + Math.floor(this.r() * 11) - 5, VILLAGE.y + Math.floor(this.r() * 9) - 4);
      s.push({ action: 'walk_to', args: target, label: lounge ? 'Passa dalla lounge' : 'Gira per l’atrio' });
      s.push({ action: 'wait', args: { s: 2 + Math.floor(this.r() * 4) }, label: 'Prende appunti' });
    }
    a.steps = s;
    a.current = 0;
    a.stepT = 0;
  }

  private pickOther(a: Actor): Actor | undefined {
    const list = [...this.actors.values()].filter((o) => o.id !== a.id && o.kind === 'agent');
    return list[Math.floor(this.r() * list.length)];
  }

  /** Group plans summarise what each member is about to do (who does what). */
  private groupPlans(only?: string) {
    for (const g of this.groups.values()) {
      if (only && g.id !== only) continue;
      const steps: PlanStep[] = [];
      const refs: GroupStepRef[] = [];
      for (const id of g.members) {
        const m = this.actors.get(id);
        if (!m) continue;
        if (g.pattern === 'crowd') {
          steps.push({ action: 'wander', args: { who: id }, label: 'Affianca il team' });
          refs.push({ who: id, src: 1, plan: m.steps, done: false });
          continue;
        }
        const own = m.steps.map((st, i) => ({ st, i })).filter(({ st }) => st.action !== 'walk_to').slice(0, 2);
        for (const { st, i } of own) {
          steps.push({ action: st.action, args: { ...st.args, who: id }, label: st.label });
          refs.push({ who: id, src: i, plan: m.steps, done: false });
        }
      }
      if (!steps.length) continue;
      const tracked = { refs, current: 0 };
      this.groupProgress.set(g.id, tracked);
      tracked.current = this.groupCurrent(tracked.refs);
      this.emit({ type: 'plan', id: g.id, scope: 'group', steps, current: tracked.current, reason: g.lastDecision?.summary ?? '', createdAt: Date.now() });
      this.god.deliberation(g, this.elapsed, DELIBERATION_GAP_SEC).forEach((d, i) =>
        setTimeout(() => this.emit({ type: 'deliberation', groupId: g.id, pattern: g.pattern, ...d }), (i * 1200) / SPEED),
      );
    }
  }

  /** First group step whose assigned member has not completed it yet. */
  private groupCurrent(refs: GroupStepRef[]): number {
    for (const r of refs) {
      const m = this.actors.get(r.who);
      // a step stays done once done; it only counts while the member still runs the plan it came from
      if (!r.done && m && m.steps === r.plan && m.current > r.src) r.done = true;
    }
    const i = refs.findIndex((r) => !r.done);
    return i === -1 ? refs.length : i;
  }

  /** Advance the active step of the member's group plan, if it moved. */
  private advanceGroup(a: Actor) {
    const tracked = a.groupId ? this.groupProgress.get(a.groupId) : undefined;
    if (!tracked) return;
    const cur = this.groupCurrent(tracked.refs);
    if (cur !== tracked.current) {
      tracked.current = cur;
      this.emit({ type: 'plan_progress', id: a.groupId!, current: cur });
    }
  }


  // ------------------------------------------------------------ simulation

  private tick() {
    const dt = (TICK_MS / 1000) * SPEED;
    this.elapsed += dt;
    this.advanceTime(dt);
    for (const a of this.actors.values()) {
      if (!a.alive) continue;
      a.hunger = clamp(a.hunger + dt * (this.rule('stress.per_hour') / 60) * MINUTES_PER_SEC * 0.25 * (this.time.freeze ? 1.5 : 1), 0, 100);
      if (this.time.freeze && a.kind === 'agent' && a.anim !== 'sleep') a.hp = clamp(a.hp - dt * (this.rule('freeze.energy_drain') / 60) * MINUTES_PER_SEC * 0.15, 20, a.maxHp);
      if (a.kind === 'player') this.movePlayer(a, dt);
      else if (this.elapsed >= a.busyUntil && this.elapsed >= a.thinkingUntil) this.runStep(a, dt);
    }
    this.minds.tick(dt);
    this.society.tick(dt, this.elapsed);
    this.ideas.tick(dt, this.elapsed);
    if (this.elapsed >= this.regrowAt) {
      this.regrowAt = this.elapsed + REGROW_EVERY;
      this.regrow();
    }
    for (const t of TECHS) if (t.at !== null && t.at > 0 && this.elapsed >= t.at && !this.econ.isDiscovered(t.code)) this.discover(t);
    if (this.elapsed >= this.spoilAt) {
      this.spoilAt = this.elapsed + SPOIL_EVERY[0] + this.r() * (SPOIL_EVERY[1] - SPOIL_EVERY[0]);
      this.spoil();
    }
    if (this.elapsed >= this.flowsAt) {
      this.flowsAt = this.elapsed + FLOWS_EVERY;
      this.emitFlows();
    }
    this.chatterT -= dt;
    if (this.chatterT <= 0) {
      this.chatterT = 5 + this.r() * 5;
      this.chatter();
    }
    if (!this.rulesDone && this.elapsed > RULES_CHANGE_AT) {
      this.rulesDone = true;
      this.changeRule('risk.appetite', 0.3, 'Il board chiede prudenza: il comitato pesa di più il rischio.');
    }
    if (!this.hireDone && this.elapsed > HIRE_AT) {
      this.hireDone = true;
      this.hire();
    }
    if (!this.freezeDone && this.elapsed > FREEZE_AT) {
      this.freezeDone = true;
      this.startFreeze();
    }
    if (!this.burnoutDone && this.elapsed > BURNOUT_AT) {
      this.burnoutDone = true;
      this.burnout(BURNOUT_ID);
    }
    this.emit({
      type: 'state',
      t: Date.now(),
      entities: [...this.actors.values()].map((a) => ({
        id: a.id,
        x: +a.x.toFixed(3),
        y: +a.y.toFixed(3),
        dir: a.dir,
        anim: a.anim,
        hp: Math.round(a.hp),
        hunger: Math.round(a.hunger),
        inventory: { ...a.inventory },
        tools: (a.tools ?? []).map((t): ToolState => ({ ...t })),
        alive: a.alive,
      })),
    });
  }

  /** A few berry bushes grow back, sent as one batched `tiles` message. */
  private regrow() {
    const items = this.tiles
      .filter((t) => ((t.biome === 'office' && t.shelter === 1) || (t.biome === 'lab' && t.shelter === 1)) && this.r() < 0.12)
      .slice(0, 8)
      .map((t) => {
        if (t.biome === 'lab') t.wood = Math.min(8, t.wood + 2);
        else t.food = Math.min(REGROW_MAX_FOOD, t.food + 1);
        return { x: t.x, y: t.y, food: t.food, wood: t.wood, shelter: t.shelter };
      });
    if (items.length) this.emit({ type: 'tiles', items });
  }

  private advanceTime(dt: number) {
    const before = Math.floor(this.time.minute);
    this.time.minute += dt * MINUTES_PER_SEC;
    if (this.time.minute >= 1440) {
      this.time.minute -= 1440;
      this.time.day += 1;
      this.maybeNewQuarter();
    }
    if (Math.floor(this.time.minute / 5) !== Math.floor(before / 5)) this.emit({ type: 'time', ...this.time, minute: Math.floor(this.time.minute) });
    // agents head home at dusk
    if (before < 20 * 60 && this.time.minute >= 20 * 60) {
      for (const a of this.actors.values()) if (a.kind === 'agent') this.think(a, 'La giornata è finita: si stacca.', this.r() * 2);
    }
  }

  /** A new quarter every `quarter.length_days`: OKR review, slots reset, freeze lifted. */
  private maybeNewQuarter() {
    const len = Math.max(1, this.rule('quarter.length_days'));
    if ((this.time.day - 1) % len !== 0) return;
    const q = QUARTERS[(QUARTERS.indexOf(this.time.quarter ?? START_QUARTER) + 1) % 4];
    this.time.quarter = q;
    this.time.season = QUARTER_LOOK[q];
    this.time.freeze = false;
    this.emit({ type: 'time', ...this.time, minute: Math.floor(this.time.minute) });
    this.ideas.newQuarter(q);
    this.emit({ type: 'world_event', kind: 'season', text: `Inizia il ${q}: OKR review fatta, slot idee azzerati, nuovi temi strategici.` });
    this.minds.rememberAll(`Inizia il ${q}: nuovi temi strategici e slot idee azzerati.`, 'law', 0.6, 'attesa');
    for (const a of this.actors.values()) if (a.kind === 'agent') this.think(a, `Nuovo trimestre ${q}: rivedo le priorità.`, this.r() * 3);
  }

  private startFreeze() {
    this.time.freeze = true;
    this.emit({ type: 'time', ...this.time, minute: Math.floor(this.time.minute) });
    this.ideas.setFreeze(true);
    this.emit({ type: 'world_event', kind: 'season', text: 'Freeze di budget: niente nuove assunzioni, solo idee a basso costo.' });
    this.minds.rememberAll('È scattato il freeze di budget: ogni idea deve costare poco.', 'danger', 0.7, 'preoccupazione');
    this.emit({ type: 'lorebase', ...this.lorebase, revision: (this.lorebase.revision = 'b71e0d4') });
    for (const a of this.actors.values()) if (a.kind === 'agent') this.think(a, 'Freeze di budget: rivedo il piano.', this.r() * 3);
    const track = this.groups.get('g-track');
    if (track) {
      track.pattern = 'assembly';
      track.name = 'Hackathon del freeze';
      track.lastDecision = ASSEMBLY_DECISION;
      this.emit({ type: 'group', group: track });
      this.emit({ type: 'world_event', kind: 'group', text: 'Il Discovery track diventa un hackathon e vota su cosa puntare.' });
    }
    setTimeout(() => this.groupPlans(), 5000 / SPEED);
  }

  /** New colleague joins the discovery track. */
  private hire() {
    const id = 'a-fabio';
    if (this.actors.has(id)) return;
    const spot = this.freeNear(21, 33);
    const a = this.makeActor({ id, name: 'Fabio', role: 'researcher', tier: 'haiku', kind: 'agent', groupId: 'g-track', speed: 1.7, ...spot }, 'curioso e metodico');
    this.actors.set(id, a);
    this.society.decorate(a);
    this.minds.seedAgent(id, a.role);
    const g = this.groups.get('g-track');
    if (g && !g.members.includes(id)) {
      g.members.push(id);
      this.emit({ type: 'group', group: g });
    }
    this.emit({ type: 'entity_added', entity: this.snapshotEntity(a) });
    this.emit({ type: 'world_event', kind: 'birth', text: 'Fabio entra in azienda come researcher nel Discovery track.', at: spot });
    this.think(a, 'Primo giorno: leggo il playbook dei researcher.', 1);
  }

  /** Someone burns out and leaves; their ideas lose a champion. */
  private burnout(id: string) {
    const a = this.actors.get(id);
    if (!a || !a.alive) return;
    a.alive = false;
    a.hp = 0;
    this.emit({ type: 'world_event', kind: 'death', text: `${a.name} è in burnout e lascia l’hub per un periodo.`, at: { x: Math.round(a.x), y: Math.round(a.y) } });
    this.minds.rememberAll(`${a.name} è andato in burnout: troppo stress durante il freeze.`, 'danger', 0.8, 'tristezza');
    this.ideas.orphan(id);
    setTimeout(() => {
      this.actors.delete(id);
      for (const g of this.groups.values()) {
        if (!g.members.includes(id)) continue;
        g.members = g.members.filter((m) => m !== id);
        if (g.leader === id) g.leader = g.members[0] ?? null;
        this.emit({ type: 'group', group: g });
      }
      this.emit({ type: 'entity_removed', id, reason: 'burnout' });
    }, 2500 / SPEED);
  }

  private changeRule(key: string, value: RuleValue, why: string) {
    this.applyRule(key, { kind: 'patch', value }, why);
  }

  /** Accept a law mutation: applied shortly (direct) or after a proposal branch is reviewed and merged. */
  private submitRule(key: string, op: RuleOp, mode: RuleMode, message: string): RuleMutationResult {
    if (mode === 'direct') {
      setTimeout(() => this.applyRule(key, op, message || 'Modifica diretta'), 600);
      return { branch: this.lorebase.branch };
    }
    const verb = op.kind === 'create' ? 'Nuova legge' : op.kind === 'remove' ? 'Ritiro legge' : 'Modifica legge';
    const branch = `proposal/${key.replace(/[._]/g, '-')}-${Math.floor(this.r() * 1e4)}`;
    const p = this.god.openProposal(`${verb}: ${key}${message ? ` (${message})` : ''}`, branch, this.youId ? (this.actors.get(this.youId)?.name ?? 'Dio') : 'Dio');
    this.emit({ type: 'world_event', kind: 'rules', text: `Proposta aperta su ⎇ ${branch}: ${verb.toLowerCase()} ${key}.` });
    setTimeout(() => {
      this.god.closeProposal(p.id, 'merged');
      this.applyRule(key, op, `merge di ${p.id}${message ? `: ${message}` : ''}`);
    }, (PROPOSAL_MERGE_SEC * 1000) / SPEED);
    return { branch, proposal: { id: p.id, branch, title: p.title } };
  }

  private applyRule(key: string, op: RuleOp, why: string) {
    const idx = this.rules.findIndex((r) => r.key === key);
    const rule = this.rules[idx];
    let change: RuleChange;
    if (op.kind === 'create' && !rule) {
      const r: Rule = { key, value: op.value, text: op.text || key, category: op.category || 'altro', unit: op.unit || '' };
      this.rules.push(r);
      change = { key, old: '', new: r.value, text: r.text, category: r.category, unit: r.unit };
    } else if (!rule) return;
    else if (op.kind === 'remove') {
      this.rules.splice(idx, 1);
      change = { key, old: rule.value, new: rule.value, text: rule.text, removed: true };
    } else {
      const old = rule.value;
      if (op.value !== undefined) rule.value = op.value;
      if (op.text) rule.text = op.text;
      if (op.category) rule.category = op.category;
      if (op.unit) rule.unit = op.unit;
      change = { key, old, new: rule.value, text: rule.text, category: rule.category, unit: rule.unit };
    }
    const rev = Math.floor(this.r() * 0xfffffff).toString(16).padStart(7, '0');
    this.lorebase.revision = rev;
    this.emit({ type: 'rules_changed', revision: rev, changes: [change] });
    const what = change.removed ? `Policy ritirata: ${change.text}` : op.kind === 'create' ? `Nuova policy: ${change.text} = ${change.new}` : `Policy cambiata: ${change.text} ${change.old} → ${change.new}`;
    this.god.commit(rev, `${what} (${why})`, ['rule']);
    this.minds.rememberAll(`${what}.`, 'law', 0.6, 'preoccupazione');
    this.emit({ type: 'world_event', kind: 'rules', text: `${what}. ${why}` });
    // a couple of agents react
    const reactors = [...this.actors.values()].filter((a) => a.kind === 'agent').slice(0, 3);
    reactors.forEach((a, i) =>
      setTimeout(() => this.emit({ type: 'say', from: a.id, to: 'all', text: i === 0 ? 'Le policy sono cambiate: rifacciamo i conti sugli score.' : 'Allora ripenso il pitch.', kind: 'speech' }), 800 + i * 1500),
    );
    if (reactors[1]) this.think(reactors[1], `${what}`, 1.5);
  }

  private faceTo(a: Actor, dx: number, dy: number) {
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;
    a.dir = (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n') as Dir;
  }

  private runStep(a: Actor, dt: number) {
    const step = a.steps[a.current];
    if (!step) {
      if (a.kind === 'crowd') this.crowdPlan(a);
      else if (a.steps.length) this.think(a, 'Ho finito il piano: cosa viene dopo?');
      else if (this.elapsed >= a.thinkingUntil && a.thinkingUntil > 0) this.think(a, 'Riprendo da capo.');
      return;
    }
    const args = step.args as { x?: number; y?: number; s?: number; to?: string; text?: string; items?: ItemBag; give?: ItemBag; get?: ItemBag; recipe?: string };
    const next = () => {
      a.current++;
      a.stepT = 0;
      a.path = [];
      a.anim = 'idle';
      if (a.kind === 'agent') this.emit({ type: 'plan_progress', id: a.id, current: a.current });
      this.advanceGroup(a);
    };
    switch (step.action) {
      case 'walk_to':
      case 'carry_to': {
        if (a.stepT === 0) a.path = this.findPath(a, { x: args.x!, y: args.y! });
        a.stepT += dt;
        if (!this.followPath(a, dt)) {
          if (step.action === 'carry_to') {
            const t = this.tile(args.x!, args.y!);
            if (t && a.inventory.wood > 0) {
              t.wood += a.inventory.wood;
              a.inventory.wood = 0;
              this.emit({ type: 'tile', x: t.x, y: t.y, food: t.food, wood: t.wood, shelter: t.shelter });
            }
          }
          next();
        }
        break;
      }
      case 'chop':
      case 'gather':
      case 'build':
      case 'take': {
        a.anim = 'work';
        this.faceTo(a, args.x! - a.x, args.y! - a.y);
        a.stepT += dt;
        const dur = step.action === 'build' ? 5 : step.action === 'take' ? 1 : 2.6;
        if (a.stepT >= dur) {
          this.applyWork(a, step.action, args.x!, args.y!);
          next();
        }
        break;
      }
      case 'produce':
        a.anim = 'work';
        a.stepT += dt;
        if (a.stepT >= 2.8) {
          for (const [k, n] of Object.entries(args.items ?? {})) a.inventory[k] = Math.min(BAG_CAP, (a.inventory[k] ?? 0) + n);
          next();
        }
        break;
      case 'craft': {
        const rec = this.econ.recipe(args.recipe ?? '');
        if (!rec || !this.hasAll(a, rec.inputs)) {
          next();
          break;
        }
        a.anim = 'work';
        a.stepT += dt;
        if (a.stepT >= 2.4) {
          for (const [k, n] of Object.entries(rec.inputs)) this.take(a, k, n);
          for (const [k, n] of Object.entries(rec.outputs)) a.inventory[k] = (a.inventory[k] ?? 0) + n;
          const at = { x: Math.round(a.x), y: Math.round(a.y) };
          this.emit({ type: 'craft', by: a.id, recipe: rec.code, inputs: { ...rec.inputs }, outputs: { ...rec.outputs }, at });
          this.minds.remember(a.id, `Ho fabbricato ${fmtBag(rec.outputs)} con ${fmtBag(rec.inputs)}.`, 'craft', 0.5, 'orgoglio');
          next();
        }
        break;
      }
      case 'give': {
        a.anim = 'idle';
        a.stepT += dt;
        if (a.stepT >= 0.8) {
          this.giveTo(a, this.actors.get(args.to ?? ''), args.give ?? {}, args.get);
          next();
        }
        break;
      }
      case 'eat':
        a.anim = 'eat';
        a.stepT += dt;
        if (a.stepT >= 2) {
          a.hunger = Math.max(0, a.hunger - 40);
          a.hp = Math.min(a.maxHp, a.hp + 10);
          next();
        }
        break;
      case 'say':
        if (a.stepT === 0) {
          this.emit({ type: 'say', from: a.id, to: args.to ?? 'all', text: args.text ?? '…', kind: 'speech' });
          const other = this.actors.get(args.to ?? '');
          if (other?.kind === 'agent') {
            this.minds.remember(a.id, `Ho parlato con ${other.name}.`, 'talk', 0.3, 'calma');
            this.minds.remember(other.id, `${a.name} mi ha parlato.`, 'talk', 0.3, 'calma');
          }
        }
        a.stepT += dt;
        if (a.stepT > 2.5) next();
        break;
      case 'sleep':
        a.anim = 'sleep';
        a.stepT += dt;
        a.hp = Math.min(a.maxHp, a.hp + dt);
        if (a.stepT >= (args.s ?? 10) && !(this.time.minute > 20 * 60 || this.time.minute < 6 * 60)) next();
        break;
      default:
        a.anim = 'idle';
        a.stepT += dt;
        if (a.stepT >= (args.s ?? 2)) next();
    }
  }

  /** Returns true while still walking. */
  private followPath(a: Actor, dt: number): boolean {
    const target = a.path[0];
    if (!target) return false;
    a.anim = 'walk';
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const d = Math.hypot(dx, dy);
    const stepLen = a.speed * dt;
    this.faceTo(a, dx, dy);
    if (d <= stepLen) {
      a.x = target.x;
      a.y = target.y;
      a.path.shift();
    } else {
      a.x += (dx / d) * stepLen;
      a.y += (dy / d) * stepLen;
    }
    return a.path.length > 0 || d > stepLen;
  }

  private applyWork(a: Actor, action: string, x: number, y: number) {
    const t = this.tile(x, y);
    if (!t) return;
    if (action === 'chop' && t.wood > 0) {
      const got = Math.min(t.wood, this.rule('data.per_benchmark'));
      t.wood -= got;
      a.inventory.wood += got;
      this.wear(a, 'laptop', false);
    } else if (action === 'gather' && t.food > 0) {
      const got = Math.min(t.food, this.rule('signals.per_scan'));
      t.food -= got;
      a.inventory.food += got;
      if (this.r() < 0.35) this.wear(a, 'notebook', true);
      if (a.kind === 'agent' && this.r() < 0.4) this.ideas.spark(a.id);
    } else if (action === 'take' && t.wood > 0) {
      const got = Math.min(t.wood, 4);
      t.wood -= got;
      a.inventory.wood += got;
    } else if (action === 'build') {
      if (a.inventory.wood > 0 || a.kind === 'player') {
        a.inventory.wood = Math.max(0, a.inventory.wood - 4);
        if (t.shelter < 2 && this.r() < 0.45) {
          t.shelter = (t.shelter + 1) as 1 | 2;
          this.emit({ type: 'world_event', kind: 'build', text: `${a.name} ha ${t.shelter === 1 ? 'montato una lavagna' : 'allestito una sala riunioni'}.`, at: { x, y } });
        }
      }
    } else return;
    this.emit({ type: 'tile', x: t.x, y: t.y, food: t.food, wood: t.wood, shelter: t.shelter });
  }

  // ------------------------------------------------------------ economy helpers

  private hasAll(a: Actor, bag: ItemBag): boolean {
    return Object.entries(bag).every(([k, n]) => (a.inventory[k] ?? 0) >= n);
  }

  /** Remove up to `n` from a bag; zero entries are dropped (food and wood always stay). */
  private take(a: Actor, item: string, n: number): number {
    const got = Math.min(n, a.inventory[item] ?? 0);
    if (got <= 0) return 0;
    a.inventory[item] -= got;
    if (a.inventory[item] <= 0 && item !== 'food' && item !== 'wood') delete a.inventory[item];
    return got;
  }

  private receive(a: Actor, item: string, n: number) {
    const max = TOOL_ITEMS[item];
    if (max && a.kind === 'agent') {
      const tool = a.tools?.find((t) => t.item === item);
      if (tool) tool.durability = tool.max;
      else (a.tools ??= []).push({ item, durability: max, max });
    } else a.inventory[item] = (a.inventory[item] ?? 0) + n;
  }

  /** Hand goods over (gift, or barter when `get` is given and the other side can pay). */
  private giveTo(from: Actor, to: Actor | undefined, give: ItemBag, get?: ItemBag) {
    if (!to || !to.alive) return;
    const gave: ItemBag = {};
    for (const [k, n] of Object.entries(give)) {
      const got = this.take(from, k, n);
      if (got > 0) gave[k] = got;
    }
    if (!Object.keys(gave).length) return;
    const got: ItemBag = {};
    for (const [k, n] of Object.entries(get ?? {})) {
      const g = this.take(to, k, n);
      if (g > 0) got[k] = g;
    }
    for (const [k, n] of Object.entries(gave)) this.receive(to, k, n);
    for (const [k, n] of Object.entries(got)) this.receive(from, k, n);
    const barter = Object.keys(got).length > 0;
    this.emit({ type: 'trade', from: from.id, to: to.id, give: gave, get: got, kind: barter ? 'barter' : 'gift' });
    this.econ.record(this.elapsed, from.role, to.role, gave);
    if (barter) this.econ.record(this.elapsed, to.role, from.role, got);
    this.minds.remember(from.id, `Ho dato ${fmtBag(gave)} a ${to.name}${barter ? ` in cambio di ${fmtBag(got)}` : ''}.`, 'trade', 0.35, 'generosità');
    this.minds.remember(to.id, `Ho ricevuto ${fmtBag(gave)} da ${from.name}${barter ? `, ho dato ${fmtBag(got)}` : ''}.`, 'trade', 0.35, 'gratitudine');
  }

  /** Use a tool once; it breaks at zero. Baskets also report plain wear. */
  private wear(a: Actor, item: string, reportWorn: boolean) {
    const tool = a.tools?.find((t) => t.item === item);
    if (!tool) return;
    tool.durability--;
    if (tool.durability <= 0) {
      a.tools = a.tools!.filter((t) => t !== tool);
      this.emit({ type: 'decay', id: a.id, item, amount: 1, reason: 'broken' });
      this.minds.remember(a.id, `Si è rotto ${RES_NAME[item] ?? item} mentre lo usavo.`, 'danger', 0.55, 'delusione');
    } else if (reportWorn) {
      this.emit({ type: 'decay', id: a.id, item, amount: 1, reason: 'worn' });
    }
  }

  /** A random holder loses a bit of a perishable; pots and baskets protect. */
  private spoil() {
    const holders = [...this.actors.values()].filter((a) => a.kind === 'agent' && a.alive && PERISHABLE.some((k) => (a.inventory[k] ?? 0) > 0));
    if (!holders.length) return;
    const a = holders[Math.floor(this.r() * holders.length)];
    if ((a.inventory.pot ?? 0) > 0 || a.tools?.some((t) => t.item === 'basket')) {
      if (this.r() < 0.6) return;
    }
    const items = PERISHABLE.filter((k) => (a.inventory[k] ?? 0) > 0);
    const item = items[Math.floor(this.r() * items.length)];
    const lost = this.take(a, item, a.inventory[item] > 3 ? 2 : 1);
    if (!lost) return;
    this.emit({ type: 'decay', id: a.id, item, amount: lost, reason: 'spoiled' });
    this.minds.remember(a.id, `${RES_NAME[item] ?? item} marcite prima di essere usate.`, 'danger', 0.3, 'delusione');
  }

  private emitFlows() {
    this.emit({ type: 'flows', window: FLOW_WINDOW, edges: this.econ.flows(this.elapsed) });
  }

  private discover(def: TechDef) {
    const agents = [...this.actors.values()].filter((a) => a.kind === 'agent' && a.alive);
    const by = agents.find((a) => a.role === def.byRole) ?? agents[0];
    if (!by) return;
    const at = { day: this.time.day, minute: Math.floor(this.time.minute) };
    this.econ.discover(def.code, by.name, at);
    this.emit({ type: 'discovery', tech: { code: def.code, name: def.name, description: def.description, unlocks: [...def.unlocks] }, by: by.id, role: by.role, at: { x: Math.round(by.x), y: Math.round(by.y) } });
    this.emit({ type: 'world_event', kind: 'build', text: `Scoperta: ${def.name}`, at: { x: Math.round(by.x), y: Math.round(by.y) } });
    for (const a of agents) {
      if (a === by) this.minds.remember(a.id, `Ho scoperto ${def.name}! ${def.description}`, 'discovery', 0.95, 'gioia');
      else this.minds.remember(a.id, `${by.name} ha scoperto ${def.name}.`, 'discovery', 0.6, 'meraviglia');
    }
    const roles = new Set([def.byRole]);
    for (const code of def.unlocks) {
      const rec = this.econ.recipe(code);
      if (rec) roles.add(rec.role);
    }
    for (const a of agents) if (roles.has(a.role)) this.think(a, `Nuova scoperta: ${def.name}`, this.r() * 2);
  }

  private movePlayer(p: Actor, dt: number) {
    if (p.anim === 'work' && this.elapsed < p.busyUntil) return;
    const len = Math.hypot(p.vx, p.vy);
    if (len < 0.01) {
      if (p.anim === 'walk' || this.elapsed >= p.busyUntil) p.anim = 'idle';
      return;
    }
    const step = p.speed * dt;
    const nx = p.x + (p.vx / len) * step;
    const ny = p.y + (p.vy / len) * step;
    if (this.passable(nx, p.y)) p.x = nx;
    if (this.passable(p.x, ny)) p.y = ny;
    p.anim = 'walk';
    this.faceTo(p, p.vx, p.vy);
  }

  private playerAct(action: string, args: Record<string, unknown>) {
    const p = this.youId ? this.actors.get(this.youId) : undefined;
    if (!p) return;
    const x = Number(args.x ?? Math.round(p.x));
    const y = Number(args.y ?? Math.round(p.y));
    if (action === 'eat') {
      if (p.inventory.food > 0) {
        p.inventory.food--;
        p.hunger = Math.max(0, p.hunger - 40);
        p.anim = 'eat';
        p.busyUntil = this.elapsed + 1.2;
      }
      return;
    }
    if (action === 'give') {
      const to = this.actors.get(String(args.to));
      const item = args.item === 'wood' ? 'wood' : 'food';
      if (to && p.inventory[item] > 0) {
        p.inventory[item]--;
        to.inventory[item]++;
      }
      return;
    }
    p.anim = 'work';
    p.busyUntil = this.elapsed + 0.8;
    this.applyWork(p, action, x, y);
  }

  private chatter() {
    const agents = [...this.actors.values()].filter((a) => a.kind !== 'player' && a.alive && a.anim !== 'sleep');
    for (let i = 0; i < 12; i++) {
      const a = agents[Math.floor(this.r() * agents.length)];
      const b = agents.find((o) => o !== a && Math.hypot(o.x - a.x, o.y - a.y) < 4.5);
      if (!a || !b) continue;
      const [l1, l2] = CHATTER[Math.floor(this.r() * CHATTER.length)];
      this.emit({ type: 'say', from: a.id, to: b.id, text: l1, kind: 'speech' });
      setTimeout(() => this.emit({ type: 'say', from: b.id, to: a.id, text: l2, kind: 'speech' }), 2200);
      return;
    }
    // nobody close: someone thinks aloud
    const a = agents[Math.floor(this.r() * agents.length)];
    if (a?.kind === 'agent') this.emit({ type: 'say', from: a.id, to: 'all', text: THOUGHTS[Math.floor(this.r() * THOUGHTS.length)], kind: 'thought' });
  }

  private reply(to: string, text: string) {
    const a = this.actors.get(to);
    const p = this.youId ? this.actors.get(this.youId) : undefined;
    if (!a || !p) return;
    a.busyUntil = this.elapsed + 8;
    a.anim = 'idle';
    this.faceTo(a, p.x - a.x, p.y - a.y);
    this.emit({ type: 'thinking', id: a.id, on: true });
    const pool = REPLIES[a.role] ?? DEFAULT_REPLY;
    let answer = pool[Math.floor(this.r() * pool.length)];
    if (/polic|legg|regol|law/i.test(text)) answer = `Le policy le custodisce Lorebase. Oggi la propensione al rischio è ${this.rule('risk.appetite')} e per approvare serve uno score medio di ${this.rule('committee.approve_threshold')}.`;
    else if (/idea|ide[ea]/i.test(text)) answer = `Sto seguendo ${this.ideas.championedBy(a.id) ?? 'un paio di segnali'}. Lo trovi sull’Idea Board (tasto I).`;
    else if (/ciao|salve|hello/i.test(text)) answer = `Ciao, ${p.name}! Sono ${a.name}. ${answer}`;
    const chunks = answer.match(/.{1,4}/gsu) ?? [answer];
    setTimeout(() => {
      this.emit({ type: 'thinking', id: a.id, on: false });
      chunks.forEach((c, i) =>
        setTimeout(() => this.emit({ type: 'say_delta', from: a.id, to: p.id, delta: c, done: i === chunks.length - 1 }), i * 45),
      );
    }, 900);
  }
}
