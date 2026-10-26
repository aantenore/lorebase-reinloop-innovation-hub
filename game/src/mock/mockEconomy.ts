import type { Economy, FlowEdge, GameTime, ItemBag, Recipe, Resource, Tech, ToolState } from '../net/protocol';

/** Station name for recipes that need the whiteboard. */
export const FIRE = 'lavagna';

export const RESOURCES: Resource[] = [
  { code: 'food', name: 'Segnale', perishable: true },
  { code: 'wood', name: 'Dato', perishable: false },
  { code: 'interview', name: 'Intervista utente', perishable: true },
  { code: 'trend', name: 'Trend report', perishable: false },
  { code: 'paper', name: 'Paper tecnico', perishable: false },
  { code: 'laptop', name: 'Laptop', perishable: false },
  { code: 'notebook', name: 'Notebook', perishable: false },
  { code: 'persona', name: 'Persona', perishable: false },
  { code: 'insight_card', name: 'Insight card', perishable: false },
  { code: 'mockup', name: 'Mockup', perishable: false },
  { code: 'market_map', name: 'Mappa di mercato', perishable: false },
  { code: 'business_case', name: 'Business case', perishable: false },
  { code: 'onepager', name: 'One-pager', perishable: false },
];

export const RES_NAME: Record<string, string> = Object.fromEntries(RESOURCES.map((r) => [r.code, r.name]));
export const PERISHABLE = RESOURCES.filter((r) => r.perishable).map((r) => r.code);

/** Items that, once handed over, are carried as tools (with durability) instead of bag items. */
export const TOOL_ITEMS: Record<string, number> = { laptop: 8, notebook: 10 };

export const RECIPES: Recipe[] = [
  { code: 'laptop', name: 'Laptop', inputs: { wood: 2, paper: 1 }, outputs: { laptop: 1 }, role: 'engineer', tech: 'evals', station: null },
  { code: 'notebook', name: 'Notebook', inputs: { trend: 2, paper: 1 }, outputs: { notebook: 1 }, role: 'engineer', tech: 'rag', station: null },
  { code: 'insight_card', name: 'Insight card', inputs: { food: 2, wood: 1 }, outputs: { insight_card: 1 }, role: 'analyst', tech: 'rag', station: null },
  { code: 'persona', name: 'Persona', inputs: { interview: 2, food: 1 }, outputs: { persona: 1 }, role: 'designer', tech: 'evals', station: null },
  { code: 'mockup', name: 'Mockup', inputs: { persona: 1, insight_card: 1 }, outputs: { mockup: 1 }, role: 'designer', tech: 'agents', station: FIRE },
  { code: 'market_map', name: 'Mappa di mercato', inputs: { trend: 2, paper: 1 }, outputs: { market_map: 1 }, role: 'researcher', tech: 'synth_users', station: FIRE },
  { code: 'business_case', name: 'Business case', inputs: { market_map: 1, insight_card: 2, wood: 1 }, outputs: { business_case: 1 }, role: 'strategist', tech: 'mcp', station: FIRE },
  { code: 'onepager', name: 'One-pager', inputs: { business_case: 1, mockup: 1 }, outputs: { onepager: 1 }, role: 'critic', tech: 'kg', station: null },
];

export interface TechDef {
  code: string;
  name: string;
  description: string;
  unlocks: string[];
  /** Elapsed seconds (speed-scaled) of the scripted discovery; null = known at start; -1 = never. */
  at: number | null;
  /** Role of the discoverer. */
  byRole: string;
}

export const TECHS: TechDef[] = [
  { code: 'rag', name: 'Retrieval aumentato', description: 'Recuperare la conoscenza giusta al momento giusto per sintetizzare segnali e insight.', unlocks: ['insight_card', 'agents'], at: null, byRole: 'analyst' },
  { code: 'evals', name: 'Valutazione automatica', description: 'Misurare la qualità di un’idea con criteri ripetibili invece che a sensazione.', unlocks: ['persona', 'synth_users'], at: null, byRole: 'critic' },
  { code: 'agents', name: 'Orchestrazione di agenti', description: 'Far collaborare più agenti specializzati sullo stesso problema: nascono mockup più completi.', unlocks: ['mockup', 'mcp'], at: 35, byRole: 'strategist' },
  { code: 'synth_users', name: 'Utenti sintetici', description: 'Simulare utenti per testare in fretta ipotesi di mercato prima di una vera intervista.', unlocks: ['market_map'], at: 80, byRole: 'researcher' },
  { code: 'mcp', name: 'Protocollo tool MCP', description: 'Collegare gli agenti a strumenti e fonti dati con un’interfaccia comune.', unlocks: ['business_case'], at: 140, byRole: 'engineer' },
  { code: 'kg', name: 'Grafi di conoscenza', description: 'Collegare segnali, persone e mercati in un grafo navigabile: base dei one-pager.', unlocks: ['onepager'], at: -1, byRole: 'analyst' },
];

/** Who gives what to whom, per role. `p` = chance per plan; `get` = barter counterpart. */
export interface Route {
  toRole: string;
  give: ItemBag;
  get?: ItemBag;
  p: number;
  label: string;
}

export const ROUTES: Record<string, Route[]> = {
  researcher: [
    { toRole: 'analyst', give: { food: 2 }, p: 1, label: 'Passa i segnali raccolti all’analista' },
    { toRole: 'designer', give: { food: 1, trend: 1 }, get: { interview: 1 }, p: 0.6, label: 'Scambia un trend report con un’intervista' },
  ],
  designer: [
    { toRole: 'analyst', give: { interview: 1 }, p: 0.9, label: 'Passa un’intervista all’analista' },
    { toRole: 'strategist', give: { persona: 1 }, p: 0.6, label: 'Presenta una persona alla stratega' },
  ],
  analyst: [
    { toRole: 'strategist', give: { insight_card: 1 }, p: 0.8, label: 'Porta una insight card alla stratega' },
    { toRole: 'engineer', give: { wood: 2 }, p: 0.7, label: 'Porta dati di benchmark all’ingegnere' },
    { toRole: 'critic', give: { insight_card: 1 }, p: 0.4, label: 'Sottopone una insight card al critico' },
  ],
  engineer: [
    { toRole: 'analyst', give: { laptop: 1 }, p: 0.9, label: 'Consegna un laptop all’analista' },
    { toRole: 'researcher', give: { notebook: 1 }, p: 0.9, label: 'Consegna un notebook al ricercatore' },
  ],
  intern: [
    { toRole: 'researcher', give: { trend: 2 }, p: 1, label: 'Porta trend report al ricercatore' },
    { toRole: 'designer', give: { trend: 1 }, p: 0.7, label: 'Porta un trend report alla designer' },
  ],
  strategist: [
    { toRole: 'critic', give: { business_case: 1 }, p: 0.5, label: 'Sottopone un business case al critico' },
    { toRole: 'engineer', give: { market_map: 1 }, p: 0.3, label: 'Condivide la mappa di mercato per una stima' },
  ],
  critic: [
    { toRole: 'strategist', give: { onepager: 1 }, p: 0.5, label: 'Consegna un one-pager valutato alla stratega' },
  ],
};

/** Raw goods an agent of the role goes out to produce (timed work step). */
export const PRODUCE: Record<string, { items: ItemBag; label: string }> = {
  researcher: { items: { food: 2, trend: 1 }, label: 'Scansiona il mercato' },
  designer: { items: { interview: 2 }, label: 'Intervista un utente' },
  analyst: { items: { wood: 2 }, label: 'Esegue un benchmark in lab' },
  engineer: { items: { paper: 2 }, label: 'Legge paper tecnici' },
  intern: { items: { trend: 2 }, label: 'Raccoglie trend report' },
};

/** Recipes a role tries to craft in its plan (in order). */
export const CRAFTS: Record<string, string[]> = {
  engineer: ['laptop', 'notebook'],
  analyst: ['insight_card'],
  designer: ['persona', 'mockup'],
  researcher: ['market_map'],
  strategist: ['business_case'],
  critic: ['onepager'],
};

export const START_INVENTORY: Record<string, ItemBag> = {
  strategist: { paper: 1, insight_card: 1 },
  critic: { paper: 1, trend: 1 },
  designer: { interview: 2, food: 1 },
  researcher: { trend: 2, paper: 1 },
  analyst: { wood: 2, food: 2 },
  engineer: { paper: 2, wood: 1 },
  intern: { trend: 1 },
};

/** Starting tools by agent id. */
export const START_TOOLS: Record<string, ToolState[]> = {
  'a-ada': [{ item: 'notebook', durability: 6, max: 10 }],
  'a-bruno': [{ item: 'laptop', durability: 5, max: 8 }],
  'a-elena': [{ item: 'laptop', durability: 3, max: 8 }],
};

/** Plausible first flows, shown until real trades fill the window. */
const SEED_FLOWS: FlowEdge[] = [
  { fromRole: 'researcher', toRole: 'analyst', item: 'food', amount: 4 },
  { fromRole: 'engineer', toRole: 'analyst', item: 'laptop', amount: 1 },
  { fromRole: 'intern', toRole: 'researcher', item: 'trend', amount: 3 },
  { fromRole: 'designer', toRole: 'analyst', item: 'interview', amount: 2 },
  { fromRole: 'analyst', toRole: 'strategist', item: 'insight_card', amount: 1 },
  { fromRole: 'analyst', toRole: 'engineer', item: 'wood', amount: 2 },
];

export const FLOW_WINDOW = 30;

export const fmtBag = (b: ItemBag): string =>
  Object.entries(b)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${RES_NAME[k] ?? k}`)
    .join(' e ');

/** Mutable economy knowledge (which techs are discovered) plus the trade ledger behind `flows`. */
export class EconomyState {
  private found = new Map<string, { by: string; at: GameTime }>();
  private ledger: { t: number; fromRole: string; toRole: string; item: string; amount: number }[] = [];
  private last: FlowEdge[] = SEED_FLOWS;

  constructor() {
    for (const t of TECHS) if (t.at === null) this.found.set(t.code, { by: 'il team fondatore', at: { day: 1, minute: 0 } });
    // seed trades expire after roughly one window, by then real trades exist
    for (const e of SEED_FLOWS) this.ledger.push({ t: 0, ...e });
  }

  isDiscovered(code: string): boolean {
    return this.found.has(code);
  }

  discover(code: string, by: string, at: GameTime) {
    this.found.set(code, { by, at });
  }

  recipeKnown(r: Recipe): boolean {
    return r.tech === null || this.isDiscovered(r.tech);
  }

  /** False while the item can only come from a recipe nobody has discovered yet. */
  recipeKnownItem(item: string): boolean {
    const makers = RECIPES.filter((r) => item in r.outputs);
    return !makers.length || makers.some((r) => this.recipeKnown(r));
  }

  recipe(code: string): Recipe | undefined {
    const r = RECIPES.find((x) => x.code === code);
    return r && this.recipeKnown(r) ? r : undefined;
  }

  economy(): Economy {
    const techs: Tech[] = TECHS.map((t) => {
      const f = this.found.get(t.code);
      return f
        ? { code: t.code, name: t.name, description: t.description, discovered: true, discoveredBy: f.by, discoveredAt: f.at, unlocks: [...t.unlocks] }
        : { code: t.code, name: '???', description: '', discovered: false, discoveredBy: null, discoveredAt: null, unlocks: [...t.unlocks] };
    });
    const known = RECIPES.filter((r) => this.recipeKnown(r));
    return {
      resources: RESOURCES.map((r) => ({ ...r })),
      recipes: known.map((r) => structuredClone(r)),
      techs,
      hiddenRecipes: RECIPES.length - known.length,
    };
  }

  record(now: number, fromRole: string, toRole: string, bag: ItemBag) {
    for (const [item, amount] of Object.entries(bag)) if (amount > 0) this.ledger.push({ t: now, fromRole, toRole, item, amount });
  }

  /** Aggregate the trades inside the sliding window. */
  flows(now: number): FlowEdge[] {
    this.ledger = this.ledger.filter((l) => now - l.t <= FLOW_WINDOW);
    const agg = new Map<string, FlowEdge>();
    for (const l of this.ledger) {
      const k = `${l.fromRole}>${l.toRole}>${l.item}`;
      const e = agg.get(k);
      if (e) e.amount += l.amount;
      else agg.set(k, { fromRole: l.fromRole, toRole: l.toRole, item: l.item, amount: l.amount });
    }
    if (agg.size) this.last = [...agg.values()];
    return this.last.map((e) => ({ ...e }));
  }
}
