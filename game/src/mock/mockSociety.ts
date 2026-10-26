import type { AgeStage, Entity, Family, ItemBag, LawProposalMsg, Opinion, Person, ServerMsg, Society } from '../net/protocol';

/** Real seconds (speed 1) between reputation rounds, opinion shifts, skill gains and barter offers. */
const REPUTATION_EVERY = 8;
const OPINION_EVERY = 6;
const SKILL_EVERY = 17;
const OFFER_EVERY = 12;
/** Seconds before a pending offer is answered. */
const OFFER_ANSWER_SEC = 4;
/** Scripted moments: an intern joins the staff, a colleague becomes a veteran. */
const COMING_OF_AGE_AT = 75;
const ELDER_AT = 140;
const PROPOSALS_AT: [number, Omit<LawProposalMsg, 'type'>][] = [
  [10, { id: 'lp-1', by: 'a-sergio', text: 'Ogni idea sia valutata da almeno tre revisori prima di arrivare in comitato.', key: 'review.min_reviewers', category: 'portfolio', value: 3, branch: 'proposal/review-min-reviewers', status: 'open' }],
  [24, { id: 'lp-2', by: 'a-ada', text: 'Cinque slot nel portfolio a trimestre: le idee buone non devono restare in coda.', key: 'ideas.slots_per_quarter', category: 'portfolio', value: 5, branch: 'proposal/ideas-slots-per-quarter', status: 'open' }],
];
const PROPOSAL_REJECTED_AT = 50;

interface Seed {
  id: string;
  name: string;
  role: string;
  family: string | null;
  parents: [string, string] | null;
  stage: AgeStage;
  days: number;
  esteem: number;
  fame: number;
}

/** Staff with their careers; former colleagues (`x-` ids) are people of the company, never entities. */
const SEEDS: Seed[] = [
  { id: 'x-marcello', name: 'Marcello', role: 'engineer', family: 'f-platform', parents: null, stage: 'elder', days: 22400, esteem: 0.7, fame: 40 },
  { id: 'x-paola', name: 'Paola', role: 'strategist', family: 'f-growth', parents: null, stage: 'elder', days: 23100, esteem: 0.6, fame: 35 },
  { id: 'a-ottavia', name: 'Ottavia', role: 'strategist', family: 'f-growth', parents: null, stage: 'elder', days: 21000, esteem: 0.9, fame: 78 },
  { id: 'a-sergio', name: 'Sergio', role: 'critic', family: 'f-growth', parents: null, stage: 'adult', days: 15300, esteem: 0.62, fame: 44 },
  { id: 'a-elena', name: 'Elena', role: 'analyst', family: 'f-growth', parents: null, stage: 'adult', days: 10200, esteem: 0.5, fame: 20 },
  { id: 'a-carla', name: 'Carla', role: 'engineer', family: 'f-platform', parents: null, stage: 'adult', days: 12800, esteem: 0.66, fame: 38 },
  { id: 'a-davide', name: 'Davide', role: 'engineer', family: 'f-platform', parents: null, stage: 'adult', days: 9600, esteem: 0.52, fame: 26 },
  { id: 'a-ada', name: 'Ada', role: 'researcher', family: 'f-labs', parents: null, stage: 'adult', days: 9100, esteem: 0.74, fame: 47 },
  { id: 'a-bruno', name: 'Bruno', role: 'analyst', family: 'f-labs', parents: null, stage: 'adult', days: 11700, esteem: 0.48, fame: 22 },
  { id: 'a-serena', name: 'Serena', role: 'designer', family: 'f-labs', parents: null, stage: 'adult', days: 12400, esteem: 0.68, fame: 36 },
  { id: 'c-0', name: 'Luca', role: 'intern', family: 'f-platform', parents: null, stage: 'child', days: 8200, esteem: 0.2, fame: 4 },
  { id: 'c-1', name: 'Marta', role: 'intern', family: 'f-labs', parents: null, stage: 'child', days: 8600, esteem: 0.25, fame: 6 },
  { id: 'c-2', name: 'Nico', role: 'intern', family: null, parents: null, stage: 'child', days: 8000, esteem: 0.22, fame: 3 },
];

const FAMILIES: { id: string; name: string; founder: string }[] = [
  { id: 'f-platform', name: 'Team Piattaforma', founder: 'x-marcello' },
  { id: 'f-growth', name: 'Team Crescita', founder: 'a-ottavia' },
  { id: 'f-labs', name: 'Team Labs', founder: 'a-ada' },
];

const OPINION_REASONS: [number, string][] = [
  [0.7, 'ha difeso la mia idea in comitato'],
  [0.5, 'mi ha aiutato a validare un segnale'],
  [0.4, 'consegna sempre quello che promette'],
  [-0.4, 'si prende il merito del lavoro degli altri'],
  [-0.6, 'ha bocciato la mia idea senza leggerla'],
  [-0.3, 'parla troppo in riunione e porta pochi dati'],
];

/** Barters the colleagues propose to each other. */
const OFFERS: { give: ItemBag; want: ItemBag }[] = [
  { give: { wood: 2 }, want: { laptop: 1 } },
  { give: { food: 3 }, want: { insight_card: 1 } },
  { give: { interview: 1 }, want: { food: 2 } },
  { give: { trend: 2 }, want: { notebook: 1 } },
  { give: { paper: 2 }, want: { wood: 3 } },
];

/** Recipes each role can get better at. */
const SKILLS: Record<string, string[]> = {
  engineer: ['laptop', 'notebook'],
  analyst: ['insight_card'],
  designer: ['persona', 'mockup'],
  researcher: ['market_map'],
  strategist: ['business_case'],
  critic: ['onepager'],
};

export interface SocietyHooks {
  emit(m: ServerMsg): void;
  r(): number;
  /** Living actors (mutated in place: society fields ride on the entity). */
  actors(): Entity[];
  speed: number;
}

/** Mock society: reputation drift, opinions, aging, skills, barter offers and agents' law proposals. */
export class SocietySim {
  private people = new Map<string, Person>();
  private opinions = new Map<string, Opinion>();
  private skills = new Map<string, Map<string, number>>();
  private repAt = REPUTATION_EVERY;
  private opAt = OPINION_EVERY;
  private skillAt = 5;
  private offerAt = 7;
  private offerSeq = 0;
  private proposalsSent = 0;
  private rejected = false;
  private comingOfAge = false;
  private elder = false;

  constructor(private hooks: SocietyHooks) {
    for (const sd of SEEDS) {
      // `x-` ids are former colleagues: people of the society, never entities
      const dead = sd.id.startsWith('x-');
      this.people.set(sd.id, { id: sd.id, name: sd.name, role: sd.role, tier: 'haiku', age: { stage: sd.stage, days: sd.days }, esteem: sd.esteem, fame: sd.fame, rank: 0, family: sd.family, parents: sd.parents, alive: !dead });
    }
    const ids = SEEDS.filter((sd) => sd.id.startsWith('a-')).map((sd) => sd.id);
    for (const from of ids)
      for (const to of ids) {
        if (from === to || this.hooks.r() > 0.32) continue;
        const [score] = OPINION_REASONS[Math.floor(this.hooks.r() * OPINION_REASONS.length)];
        this.opinions.set(`${from}>${to}`, { from, to, score: +(score + (this.hooks.r() - 0.5) * 0.2).toFixed(2) });
      }
    this.rerank();
  }

  /** Copy the society fields onto an actor (called once per actor at creation). */
  decorate(e: Entity): void {
    const p = this.people.get(e.id);
    if (!p) {
      this.people.set(e.id, { id: e.id, name: e.name, role: e.role, tier: e.tier, age: { stage: 'adult', days: 9000 }, esteem: 0.3, fame: 0, rank: 0, family: null, parents: null, alive: true });
      this.rerank();
    } else Object.assign(p, { tier: e.tier, role: e.kind === 'crowd' ? p.role : e.role });
    this.sync(e);
  }

  society(): Society {
    for (const e of this.hooks.actors()) {
      const p = this.people.get(e.id);
      if (p) p.alive = e.alive;
    }
    return { people: [...this.people.values()].map((p) => ({ ...p, age: { ...p.age } })), families: this.families(), opinions: [...this.opinions.values()].map((o) => ({ ...o })) };
  }

  /** Skills the world already knows about, replayed after hello. */
  replay(): void {
    if (!this.skills.size) {
      for (const p of this.people.values()) {
        const list = SKILLS[p.role];
        if (!list || !p.alive) continue;
        this.skills.set(p.id, new Map([[list[0], 1 + Math.floor(this.hooks.r() * 3)]]));
      }
    }
    for (const [id, m] of this.skills) for (const [recipe, level] of m) this.hooks.emit({ type: 'skill', id, recipe, level });
    for (let i = 0; i < this.proposalsSent; i++) this.hooks.emit({ type: 'law_proposal', ...PROPOSALS_AT[i][1], status: i === 0 && this.rejected ? 'rejected' : 'open' });
  }

  tick(dt: number, elapsed: number): void {
    for (const p of this.people.values()) if (p.alive) p.age.days += dt * 0.0055; // ~8 game minutes per second
    if (elapsed >= this.repAt) {
      this.repAt = elapsed + REPUTATION_EVERY;
      this.reputation();
    }
    if (elapsed >= this.opAt) {
      this.opAt = elapsed + OPINION_EVERY;
      this.opinion();
    }
    if (elapsed >= this.skillAt) {
      this.skillAt = elapsed + SKILL_EVERY;
      this.skillUp();
    }
    if (elapsed >= this.offerAt) {
      this.offerAt = elapsed + OFFER_EVERY;
      this.offer();
    }
    while (this.proposalsSent < PROPOSALS_AT.length && elapsed >= PROPOSALS_AT[this.proposalsSent][0]) {
      const lp = PROPOSALS_AT[this.proposalsSent++][1];
      this.hooks.emit({ type: 'law_proposal', ...lp });
      this.hooks.emit({ type: 'world_event', kind: 'rules', text: `${this.people.get(lp.by)?.name ?? lp.by} propone una regola: ${lp.text}` });
    }
    if (!this.rejected && elapsed >= PROPOSAL_REJECTED_AT && this.proposalsSent > 0) {
      this.rejected = true;
      this.hooks.emit({ type: 'law_proposal', ...PROPOSALS_AT[0][1], status: 'rejected' });
    }
    if (!this.comingOfAge && elapsed >= COMING_OF_AGE_AT) {
      this.comingOfAge = true;
      this.age('c-1', 'adult', 'Marta entra in organico: da stagista a ruolo effettivo.');
    }
    if (!this.elder && elapsed >= ELDER_AT) {
      this.elder = true;
      this.age('a-sergio', 'elder', 'Sergio ora è un veterano dell’azienda.');
    }
  }

  // ------------------------------------------------------------ internals

  private living(): Person[] {
    const alive = new Set(this.hooks.actors().filter((e) => e.alive).map((e) => e.id));
    return [...this.people.values()].filter((p) => p.alive && alive.has(p.id));
  }

  private sync(e: Entity): void {
    const p = this.people.get(e.id);
    if (!p) return;
    Object.assign(e, { age: { ...p.age }, esteem: p.esteem, fame: p.fame, rank: p.rank, family: p.family, parents: p.parents });
  }

  private rerank(): void {
    const alive = [...this.people.values()].filter((p) => p.alive);
    alive.sort((a, b) => b.esteem * 100 + b.fame * 0.3 - (a.esteem * 100 + a.fame * 0.3));
    alive.forEach((p, i) => (p.rank = i + 1));
    for (const p of this.people.values()) if (!p.alive) p.rank = 0;
  }

  private families(): Family[] {
    return FAMILIES.map((f) => {
      const members = [...this.people.values()].filter((p) => p.family === f.id);
      const living = members.filter((p) => p.alive);
      const esteem = living.length ? living.reduce((a, p) => a + p.esteem, 0) / living.length : 0;
      return { ...f, members: members.map((p) => p.id), alive: living.length, esteem: +esteem.toFixed(3) };
    });
  }

  private reputation(): void {
    const living = this.living();
    if (!living.length) return;
    const r = this.hooks.r;
    // most drift a little, one person gets a notable jump either way
    const star = living[Math.floor(r() * living.length)];
    for (const p of living) {
      const d = p === star ? (r() < 0.6 ? 1 : -1) * (0.07 + r() * 0.06) : (r() - 0.5) * 0.03;
      p.esteem = +Math.max(0.02, Math.min(1, p.esteem + d)).toFixed(3);
      if (p === star && d > 0) p.fame += 2 + Math.floor(r() * 4);
    }
    this.rerank();
    const byId = new Map(this.hooks.actors().map((e) => [e.id, e]));
    for (const p of living) {
      const e = byId.get(p.id);
      if (e) this.sync(e);
    }
    this.hooks.emit({ type: 'reputation', people: [...this.people.values()].filter((p) => p.alive).map((p) => ({ id: p.id, esteem: p.esteem, fame: p.fame, rank: p.rank })) });
    for (const f of this.families()) this.hooks.emit({ type: 'family', family: f });
  }

  private opinion(): void {
    const living = this.living().filter((p) => p.id.startsWith('a-'));
    if (living.length < 2) return;
    const r = this.hooks.r;
    const from = living[Math.floor(r() * living.length)];
    const others = living.filter((p) => p !== from);
    const to = others[Math.floor(r() * others.length)];
    const [score, reason] = OPINION_REASONS[Math.floor(r() * OPINION_REASONS.length)];
    const key = `${from.id}>${to.id}`;
    const prev = this.opinions.get(key)?.score ?? 0;
    const next = +Math.max(-1, Math.min(1, prev * 0.5 + score * 0.7)).toFixed(2);
    this.opinions.set(key, { from: from.id, to: to.id, score: next });
    this.hooks.emit({ type: 'opinion', from: from.id, to: to.id, score: next, reason });
  }

  private skillUp(): void {
    const cands = this.living().filter((p) => SKILLS[p.role]);
    if (!cands.length) return;
    const r = this.hooks.r;
    const p = cands[Math.floor(r() * cands.length)];
    const list = SKILLS[p.role];
    const recipe = list[Math.floor(r() * list.length)];
    let m = this.skills.get(p.id);
    if (!m) this.skills.set(p.id, (m = new Map()));
    const level = Math.min(5, (m.get(recipe) ?? 0) + 1);
    m.set(recipe, level);
    this.hooks.emit({ type: 'skill', id: p.id, recipe, level });
  }

  private offer(): void {
    const agents = this.living().filter((p) => p.id.startsWith('a-'));
    if (agents.length < 2) return;
    const r = this.hooks.r;
    const from = agents[Math.floor(r() * agents.length)];
    const others = agents.filter((p) => p !== from);
    const to = others[Math.floor(r() * others.length)];
    const deal = OFFERS[Math.floor(r() * OFFERS.length)];
    const id = `of-${++this.offerSeq}`;
    const base = { type: 'offer' as const, id, from: from.id, to: to.id, give: { ...deal.give }, want: { ...deal.want } };
    this.hooks.emit({ ...base, status: 'pending' });
    // esteem tilts the answer: the trusted get more yeses
    const accepted = r() < 0.35 + from.esteem * 0.5;
    setTimeout(() => this.hooks.emit({ ...base, status: accepted ? 'accepted' : 'rejected' }), (OFFER_ANSWER_SEC * 1000) / this.hooks.speed);
  }

  private age(id: string, stage: AgeStage, text: string): void {
    const p = this.people.get(id);
    if (!p || !p.alive) return;
    p.age.stage = stage;
    const e = this.hooks.actors().find((a) => a.id === id);
    if (e) this.sync(e);
    this.hooks.emit({ type: 'aged', id, stage });
    this.hooks.emit({ type: 'world_event', kind: 'birth', text });
  }
}
