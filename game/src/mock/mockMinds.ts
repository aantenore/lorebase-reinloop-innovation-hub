import type { GameTime, Insight, InsightList, Memory, ServerMsg } from '../net/protocol';

/** What the minds engine needs from the world. */
export interface MindsHost {
  emit(m: ServerMsg): void;
  r(): number;
  now(): GameTime;
  agents(): { id: string; name: string; role: string }[];
}

export const ROLE_IT: Record<string, string> = {
  strategist: 'stratega',
  critic: 'critico',
  designer: 'designer',
  researcher: 'ricercatore',
  analyst: 'analista',
  engineer: 'ingegnere',
  intern: 'stagista',
  visitor: 'visitatore',
};

/** Shared role consciousness: the first ones are seeded as accepted, the rest get proposed over time. */
const INSIGHT_POOL: Record<string, string[]> = {
  researcher: [
    'Un segnale con una sola fonte è rumore: cercane una seconda prima di passarlo all’analista.',
    'Le interviste utente invecchiano in fretta: vanno sintetizzate entro la giornata.',
    'I trend report affollati dicono dove sono tutti, non dove sta l’opportunità.',
    'Un notebook ben tenuto vale più di dieci link salvati: annota sempre la fonte.',
    'I paper tecnici anticipano il mercato di due trimestri: leggili prima dei competitor.',
    'Conviene scansionare il mercato la mattina, quando i segnali sono ancora freschi.',
  ],
  analyst: [
    'Un segnale va validato con almeno tre dati indipendenti prima di diventare un’insight card.',
    'Un benchmark senza campione dichiarato non si cita in comitato.',
    'La correlazione non è un utente: cerca sempre chi paga per risolvere il problema.',
    'I dati di un solo laptop non fanno statistica: ripeti il benchmark su un altro campione.',
    'Un’insight card deve stare in una riga: se serve una pagina, non è ancora un’insight.',
    'Segnali e dati vanno consegnati insieme: un viaggio in meno per tutti.',
  ],
  designer: [
    'Prima la persona, poi il mockup: senza un utente reale lo schermo è decorazione.',
    'Un mockup si capisce in cinque minuti su una lavagna, o non si capisce.',
    'Le interviste si fanno con domande sul passato, non sul futuro.',
    'Un’idea con troppe funzioni non ha un problema chiaro: togli finché resta una cosa sola.',
    'Una persona senza un nome e una giornata tipo non è una persona.',
  ],
  critic: [
    'Una idea senza utente nominato non passa la review.',
    'Ogni punteggio va motivato in una frase: un 2 senza motivo è un’opinione.',
    'Se il business case regge solo con ipotesi ottimistiche, il punteggio scende di un punto.',
    'Bocciare presto costa poco: lo slot nel portfolio costa molto di più.',
    'Chiedi sempre qual è l’alternativa che l’utente usa oggi.',
  ],
  engineer: [
    'Non costruiamo: stimiamo la fattibilità in sprint e dichiariamo cosa non sappiamo.',
    'Un paper tecnico senza codice di riferimento si stima il doppio.',
    'Se la fattibilità dipende da un solo fornitore, scrivilo nel one-pager.',
    'Il laptop giusto accelera i benchmark: tieni sempre un set di dati pulito.',
    'Un prototipo mentale basta: un diagramma vale più di un repository.',
  ],
  strategist: [
    'Gli slot del portfolio sono pochi: meglio quattro idee forti che sei tiepide.',
    'Una idea buona per tutti è buona per nessuno: scegli il segmento.',
    'Il comitato decide meglio con un business case di una pagina che con venti slide.',
    'Prima di cambiare una regola, ascolta chi la vive ogni giorno in review.',
    'Con un freeze del budget il discovery track passa in hackathon: lascia votare chi lavora.',
  ],
  intern: [
    'Chiedi sempre il perché dietro un punteggio: è il modo più rapido per imparare.',
    'Un buon stagista porta un dato ogni volta che porta una domanda.',
    'Assistere a una review vale più di dieci riunioni di allineamento.',
  ],
};

interface MemSeed { text: string; topic: string; importance: number; emotion: string }

const GENERIC_SEEDS: MemSeed[] = [
  { text: 'Ho passato la mattina a rileggere segnali e appunti.', topic: 'work', importance: 0.25, emotion: 'fatica' },
  { text: 'Ieri ho aggiornato il portfolio prima della riunione.', topic: 'work', importance: 0.25, emotion: 'fatica' },
  { text: 'Ho finito una lunga giornata di riunioni a testa bassa.', topic: 'work', importance: 0.2, emotion: 'stanchezza' },
  { text: 'Ho parlato con Ottavia alla macchinetta del caffè, a metà mattina.', topic: 'talk', importance: 0.35, emotion: 'calma' },
  { text: 'Ho scambiato due parole con un visitatore all’ingresso.', topic: 'talk', importance: 0.3, emotion: 'curiosità' },
  { text: 'Una sera il team ha discusso a lungo delle regole del portfolio.', topic: 'law', importance: 0.55, emotion: 'curiosità' },
];

const ROLE_SEEDS: Record<string, MemSeed[]> = {
  researcher: [
    { text: 'Ho trovato un segnale forte in un paper poco citato.', topic: 'craft', importance: 0.65, emotion: 'gioia' },
    { text: 'Tre interviste di fila sono andate a vuoto.', topic: 'danger', importance: 0.5, emotion: 'delusione' },
  ],
  analyst: [
    { text: 'Un benchmark mal impostato mi ha fatto bocciare un’idea giusta.', topic: 'danger', importance: 0.8, emotion: 'rabbia' },
    { text: 'Ho chiuso la mia prima insight card validata con tre fonti.', topic: 'craft', importance: 0.6, emotion: 'orgoglio' },
  ],
  designer: [
    { text: 'Una persona che avevo disegnato si è rivelata sbagliata in intervista.', topic: 'danger', importance: 0.75, emotion: 'frustrazione' },
    { text: 'Il mockup alla lavagna ha convinto tutto il comitato.', topic: 'craft', importance: 0.7, emotion: 'gioia' },
  ],
  critic: [
    { text: 'Ho bocciato un’idea che poi un concorrente ha lanciato.', topic: 'danger', importance: 0.85, emotion: 'preoccupazione' },
    { text: 'Ho dato il mio primo 5 in comitato.', topic: 'craft', importance: 0.6, emotion: 'orgoglio' },
  ],
  engineer: [
    { text: 'Ho sottostimato di molto una fattibilità e il comitato se n’è accorto.', topic: 'danger', importance: 0.8, emotion: 'paura' },
    { text: 'Una stima in sprint è stata confermata dai fatti.', topic: 'craft', importance: 0.6, emotion: 'gioia' },
  ],
  strategist: [
    { text: 'Ho tagliato tre idee per fare spazio a una sola.', topic: 'danger', importance: 0.85, emotion: 'preoccupazione' },
    { text: 'Il comitato ha votato per concentrare il portfolio.', topic: 'law', importance: 0.6, emotion: 'orgoglio' },
  ],
  intern: [
    { text: 'Ho preso appunti alla mia prima review e non ho capito metà dei punteggi.', topic: 'craft', importance: 0.5, emotion: 'curiosità' },
  ],
};

const GIST: Record<string, string[]> = {
  work: ['Il lavoro quotidiano è fatto di segnali, dati e riunioni, ma ripaga.', 'Le giornate si assomigliano: scansionare, validare, discutere.'],
  talk: ['Parlo spesso con i colleghi di idee e priorità.', 'Ci si ritrova sempre alla macchinetta del caffè a parlare.'],
  trade: ['Ci si passa dati e segnali: chi ha di più dà a chi ne ha bisogno.', 'Gli scambi tengono insieme i ruoli del team.'],
  craft: ['So produrre ciò che serve, con metodo.', 'Un’idea fatta bene sopravvive alla review.'],
  law: ['Le regole del portfolio cambiano, ma ci si adatta.'],
  discovery: ['Ogni tanto una scoperta cambia il modo di lavorare del team.'],
  danger: ['Valutare male un’idea può costare caro: meglio andare con cautela.'],
};

const VAGUE = ['…', 'qualcosa', 'da qualche parte', 'qualcuno'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Blur a memory text: the lower the fidelity, the more words melt into vague ones. */
export function degrade(orig: string, id: string, fidelity: number): string {
  const words = orig.split(' ');
  const cands = words.map((w, i) => ({ w, i })).filter(({ w }) => w.replace(/[^\p{L}\d]/gu, '').length > 3);
  const n = Math.min(cands.length, Math.round(cands.length * Math.max(0, (0.85 - fidelity) / 0.85) * 1.1));
  const hit = new Set(
    [...cands].sort((a, b) => hash(id + a.i) - hash(id + b.i)).slice(0, n).map((c) => c.i),
  );
  const out: string[] = [];
  words.forEach((w, i) => {
    if (!hit.has(i)) return void out.push(w);
    const tail = /[.,;!?]$/.test(w) ? w.slice(-1) : '';
    const rep = /^\p{Lu}/u.test(w) && i > 0 ? 'qualcuno' : /\d/.test(w) ? 'alcuni' : VAGUE[hash(id + w) % 2 === 0 ? 0 : 1];
    if (out[out.length - 1]?.replace(/[.,;!?]$/, '') === rep) return;
    out.push(rep + tail);
  });
  return out.join(' ');
}

interface Mem {
  m: Memory;
  orig: string;
  topic: string;
  /** Fidelity at the last blur/recall emit. */
  lastEmit: number;
}

const MAX_MEMS = 14;

/** Private memories (reinloop) and shared role insights (Lorebase), driven by the world clock. */
export class Minds {
  private mems = new Map<string, Mem[]>();
  private seq = 1;
  private clock = 0;
  private decayAt = 3;
  private recallAt = 4;
  private insightAt: number;
  private queue: { at: number; fn: () => void }[] = [];
  private pending: Insight[] = [];
  private stored: Insight[] = [];
  private used = new Map<string, Set<number>>();
  private insSeq = 1;

  constructor(private host: MindsHost, private roles: string[]) {
    this.insightAt = 6 + host.r() * 6;
    for (const role of Object.keys(INSIGHT_POOL)) this.seedInsights(role);
  }

  // ------------------------------------------------------------ memories

  seedAgent(id: string, role: string) {
    const h = this.host;
    const seeds = [...(ROLE_SEEDS[role] ?? []), ...GENERIC_SEEDS.filter((_, i) => i < 3 + Math.floor(h.r() * 2))].slice(0, 6);
    const list: Mem[] = seeds.map((s) => {
      const fid = 0.3 + h.r() * 0.6;
      const m: Memory = {
        id: this.newId(id),
        text: s.text,
        fidelity: +fid.toFixed(2),
        importance: s.importance,
        emotion: s.emotion,
        kind: 'episodic',
        createdAt: { day: 1, minute: Math.floor(h.r() * 420) },
        recalls: 0,
      };
      return { m: { ...m, text: degrade(s.text, m.id, m.fidelity) }, orig: s.text, topic: s.topic, lastEmit: m.fidelity };
    });
    this.mems.set(id, list);
  }

  remember(agentId: string, text: string, topic: string, importance: number, emotion: string) {
    const list = this.mems.get(agentId);
    if (!list) return;
    const m: Memory = { id: this.newId(agentId), text, fidelity: 1, importance, emotion, kind: 'episodic', createdAt: this.host.now(), recalls: 0 };
    list.push({ m, orig: text, topic, lastEmit: 1 });
    this.host.emit({ type: 'memory', agentId, action: 'added', memory: { ...m } });
    if (list.length > MAX_MEMS) {
      const weakest = list.reduce((p, c) => (c.m.fidelity < p.m.fidelity ? c : p));
      this.drop(agentId, weakest);
    }
  }

  rememberAll(text: string, topic: string, importance: number, emotion: string) {
    for (const a of this.host.agents()) this.remember(a.id, text, topic, importance, emotion);
  }

  memories(id: string): Memory[] | undefined {
    return this.mems.get(id)?.map((x) => ({ ...x.m }));
  }

  private newId(agentId: string): string {
    return `m-${agentId.replace(/^a-/, '')}-${this.seq++}`;
  }

  private drop(agentId: string, x: Mem) {
    const list = this.mems.get(agentId);
    if (!list) return;
    list.splice(list.indexOf(x), 1);
    this.host.emit({ type: 'memory', agentId, action: 'forgotten', memory: { ...x.m } });
  }

  private decayStep() {
    const h = this.host;
    for (const [agentId, list] of this.mems) {
      for (const x of [...list]) {
        const slow = x.m.kind === 'gist' ? 0.4 : 1;
        x.m.fidelity = Math.max(0, +(x.m.fidelity - (0.012 + 0.035 * (1 - x.m.importance)) * (0.6 + h.r() * 0.8) * slow).toFixed(3));
        if (x.m.fidelity < 0.12) {
          this.drop(agentId, x);
        } else if (x.lastEmit - x.m.fidelity >= 0.15) {
          x.lastEmit = x.m.fidelity;
          x.m.text = degrade(x.orig, x.m.id, x.m.fidelity);
          h.emit({ type: 'memory', agentId, action: 'blurred', memory: { ...x.m } });
        }
      }
      this.mergeStep(agentId);
      if (list.length < 3) this.remember(agentId, GENERIC_SEEDS[Math.floor(h.r() * 3)].text, 'work', 0.25, 'fatica');
    }
  }

  /** 3+ similar faded episodic memories collapse into one gist. */
  private mergeStep(agentId: string) {
    const list = this.mems.get(agentId);
    if (!list) return;
    const byTopic = new Map<string, Mem[]>();
    for (const x of list) if (x.m.kind === 'episodic' && x.m.fidelity < 0.5) byTopic.set(x.topic, [...(byTopic.get(x.topic) ?? []), x]);
    for (const [topic, group] of byTopic) {
      if (group.length < 3 || !GIST[topic]) continue;
      const pool = GIST[topic];
      const text = pool[Math.floor(this.host.r() * pool.length)];
      const emotions = new Map<string, number>();
      for (const g of group) emotions.set(String(g.m.emotion), (emotions.get(String(g.m.emotion)) ?? 0) + 1);
      const emotion = [...emotions.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const m: Memory = {
        id: this.newId(agentId),
        text,
        fidelity: 0.7,
        importance: Math.min(1, +(group.reduce((s, g) => s + g.m.importance, 0) / group.length + 0.1).toFixed(2)),
        emotion,
        kind: 'gist',
        createdAt: this.host.now(),
        recalls: 0,
      };
      for (const g of group) list.splice(list.indexOf(g), 1);
      list.push({ m, orig: text, topic, lastEmit: m.fidelity });
      this.host.emit({ type: 'memory', agentId, action: 'merged', memory: { ...m }, mergedFrom: group.map((g) => g.m.id) });
      return;
    }
  }

  private recallStep() {
    const agents = [...this.mems.entries()].filter(([, l]) => l.some((x) => x.m.fidelity < 0.85));
    if (!agents.length) return;
    const [agentId, list] = agents[Math.floor(this.host.r() * agents.length)];
    const cands = list.filter((x) => x.m.fidelity < 0.85);
    const x = cands[Math.floor(this.host.r() * cands.length)];
    x.m.recalls++;
    x.m.fidelity = Math.min(1, +(x.m.fidelity + 0.15 + this.host.r() * 0.1).toFixed(3));
    x.m.text = degrade(x.orig, x.m.id, x.m.fidelity);
    x.lastEmit = x.m.fidelity;
    this.host.emit({ type: 'memory', agentId, action: 'recalled', memory: { ...x.m } });
  }

  // ------------------------------------------------------------ insights

  private seedInsights(role: string) {
    const pool = INSIGHT_POOL[role];
    const used = new Set<number>();
    this.used.set(role, used);
    const peers = this.host.agents().filter((a) => a.role === role);
    const n = 2 + Math.floor(this.host.r() * 3);
    for (let i = 0; i < Math.min(n, pool.length - 1); i++) {
      used.add(i);
      this.stored.push({
        code: `${role}.i${this.insSeq++}`,
        role,
        text: pool[i],
        confidence: +(0.65 + this.host.r() * 0.3).toFixed(2),
        author: peers[0]?.name ?? 'I veterani',
        reviewer: peers[1]?.name,
        day: 1,
        status: 'accepted',
      });
    }
  }

  private schedule(afterSec: number, fn: () => void) {
    this.queue.push({ at: this.clock + afterSec, fn });
  }

  private propose() {
    const h = this.host;
    const agents = h.agents().filter((a) => INSIGHT_POOL[a.role]);
    if (!agents.length) return;
    const author = agents[Math.floor(h.r() * agents.length)];
    const pool = INSIGHT_POOL[author.role];
    const used = this.used.get(author.role) ?? new Set<number>();
    this.used.set(author.role, used);
    let free = pool.map((_, i) => i).filter((i) => !used.has(i));
    if (!free.length) {
      // texts that are no longer accepted may be proposed again
      used.clear();
      pool.forEach((t, i) => {
        if (this.stored.some((s) => s.role === author.role && s.text === t && s.status === 'accepted')) used.add(i);
      });
      free = pool.map((_, i) => i).filter((i) => !used.has(i));
    }
    if (free.length) {
      const idx = free[Math.floor(h.r() * free.length)];
      used.add(idx);
      const ins: Insight = {
        code: `${author.role}.i${this.insSeq++}`,
        role: author.role,
        text: pool[idx],
        confidence: +(0.4 + h.r() * 0.35).toFixed(2),
        author: author.name,
        day: h.now().day,
        evidence: `Osservato ${2 + Math.floor(h.r() * 4)} volte nei trimestri scorsi`,
        status: 'proposed',
      };
      this.pending.push(ins);
      h.emit({ type: 'insight', insight: { ...ins }, action: 'proposed' });
      const peers = h.agents().filter((a) => a.role === author.role && a.id !== author.id);
      if (peers.length) {
        const reviewer = peers[Math.floor(h.r() * peers.length)];
        this.schedule(6 + h.r() * 6, () => this.review(ins, author.id, reviewer.name, h.r() < 0.8));
      } else {
        this.schedule(8 + h.r() * 6, () => this.review(ins, author.id, undefined, true));
      }
    }
    if (h.r() < 0.18) this.retireOne();
  }

  private review(ins: Insight, authorId: string, reviewer: string | undefined, accept: boolean) {
    const i = this.pending.indexOf(ins);
    if (i < 0) return;
    this.pending.splice(i, 1);
    ins.reviewer = reviewer;
    if (accept) {
      ins.status = 'accepted';
      ins.confidence = Math.min(0.95, +(ins.confidence + 0.1).toFixed(2));
      this.stored.push(ins);
      this.host.emit({ type: 'insight', insight: { ...ins }, action: 'accepted', reviewer });
      this.remember(authorId, `La mia intuizione sul ruolo è stata accettata${reviewer ? ` da ${reviewer}` : ''}.`, 'law', 0.55, 'orgoglio');
    } else {
      ins.status = 'rejected';
      this.host.emit({ type: 'insight', insight: { ...ins }, action: 'rejected', reviewer });
      this.remember(authorId, `${reviewer ?? 'Un collega'} ha respinto la mia intuizione.`, 'law', 0.5, 'delusione');
    }
  }

  private retireOne() {
    const byRole = new Map<string, Insight[]>();
    for (const s of this.stored) if (s.status === 'accepted') byRole.set(s.role, [...(byRole.get(s.role) ?? []), s]);
    const roles = [...byRole.entries()].filter(([, l]) => l.length >= 3);
    if (!roles.length) return;
    const [, list] = roles[Math.floor(this.host.r() * roles.length)];
    const old = list[0];
    old.status = 'retired';
    this.host.emit({ type: 'insight', insight: { ...old }, action: 'retired' });
  }

  insightList(role?: string): InsightList {
    const f = (l: Insight[]) => l.filter((i) => !role || i.role === role).map((i) => ({ ...i }));
    return { pending: f(this.pending), stored: f(this.stored) };
  }

  consciousness(): Record<string, Insight[]> {
    const out: Record<string, Insight[]> = {};
    for (const r of this.roles) out[r] = [];
    for (const s of this.stored) if (s.status === 'accepted') (out[s.role] ??= []).push({ ...s });
    return out;
  }

  // ------------------------------------------------------------ clock

  tick(dt: number) {
    this.clock += dt;
    if (this.clock >= this.decayAt) {
      this.decayAt = this.clock + 3;
      this.decayStep();
    }
    if (this.clock >= this.recallAt) {
      this.recallAt = this.clock + 3 + this.host.r() * 4;
      this.recallStep();
    }
    if (this.clock >= this.insightAt) {
      this.insightAt = this.clock + 15 + this.host.r() * 10;
      this.propose();
    }
    const due = this.queue.filter((q) => q.at <= this.clock);
    if (due.length) {
      this.queue = this.queue.filter((q) => q.at > this.clock);
      for (const q of due) q.fn();
    }
  }
}

const CONSULT: Record<string, string[]> = {
  lorebase_search: ['playbook analyst: come validare un segnale', 'playbook critic: criteri di punteggio', 'come condurre un’intervista utente', 'regole del portfolio', 'breakthrough scoperti', 'regole sugli scambi di dati'],
  lorebase_get_record: ['regola signals.per_scan', 'regola committee.approve_threshold', 'ricetta business case', 'ricetta insight card'],
  lorebase_list_records: ['ricette scoperte', 'regole della categoria portfolio', 'intuizioni accettate'],
};

const RESEARCH: { query: string; results: { title: string; url: string }[] }[] = [
  { query: 'mercato agent security 2026', results: [{ title: 'OWASP Top 10 for LLM Applications', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' }, { title: 'Model Context Protocol', url: 'https://modelcontextprotocol.io/' }] },
  { query: 'costi LLM per feature FinOps', results: [{ title: 'Anthropic API pricing', url: 'https://www.anthropic.com/pricing' }, { title: 'FinOps Foundation', url: 'https://www.finops.org/' }] },
  { query: 'schema registry diff semantico', results: [{ title: 'Understanding JSON Schema', url: 'https://json-schema.org/understanding-json-schema' }] },
];

/** A plausible web search, or a page fetch, for an agent that starts thinking. */
export function researchFor(r: () => number): { tool: 'web_search' | 'web_fetch'; query?: string; url?: string; results: { title: string; url: string }[] } {
  const pick = RESEARCH[Math.floor(r() * RESEARCH.length)];
  if (r() < 0.35) return { tool: 'web_fetch', url: pick.results[0].url, results: pick.results.slice(0, 1) };
  return { tool: 'web_search', query: pick.query, results: pick.results };
}

/** A plausible Lorebase lookup for an agent that starts thinking. */
export function consultFor(role: string, r: () => number): { tool: string; query: string } {
  const tools = Object.keys(CONSULT);
  const tool = tools[Math.floor(r() * tools.length)];
  if (r() < 0.3) return { tool: 'lorebase_get_record', query: `coscienza del ruolo ${ROLE_IT[role] ?? role}` };
  const qs = CONSULT[tool];
  return { tool, query: qs[Math.floor(r() * qs.length)] };
}
