// Evidence behind an idea, kept as `Evidence` Records on the idea's branch: public signals (Hacker News, GitHub,
// Stack Overflow, arXiv) and web pages a person found with their own searches, validations by a human player in the
// hub, and simulated interviews (always weight 0, labelled as hypothesis). The weights, the quotas and the
// requirements to put an idea before the committee are company policies (Lorebase `Rule` records). Results from the
// outside are untrusted text: they become evidence only through `allega_prova`, and only when their URL came back
// from the same person's own searches.
import { agent, type ModelRef, type Tool, tool } from 'reinloop';
import type { Translate } from '../i18n.ts';
import type { At } from './ideas.ts';
import { normalizeFetchUrl } from './research.ts';
import { type SignalBackendOptions, type SignalSourceName, type SignalToolSet, SOURCE_TOOL } from './signals.ts';

export const EVIDENCE_TYPES = ['public_signal', 'human_validation', 'simulated_interview', 'web_source'] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
export const EVIDENCE_SOURCES = ['hackernews', 'github', 'stackoverflow', 'arxiv', 'web', 'player', 'persona'] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];
export const PERSONAS = ['cliente', 'dpo', 'utente'] as const;
export type Persona = (typeof PERSONAS)[number];
export const VERDICTS = ['positivo', 'neutro', 'negativo'] as const;
export type Verdict = (typeof VERDICTS)[number];
/** The label every simulated interview carries. */
export const HYPOTHESIS = 'ipotesi';

export interface Evidence {
  code: string;
  idea: string;
  type: EvidenceType;
  source: EvidenceSource;
  url: string;
  title: string;
  /** Size of the signal at the source (points, stars, votes), null when the source has none. */
  metric: number | null;
  metric_name: string;
  excerpt: string;
  /** Name of who collected it (a person of the hub or the player). */
  collected_by: string;
  collected_at: At;
  weight: number;
  /** `ipotesi` on simulated interviews, empty otherwise. */
  label: string;
  /** Human validations and interviews: the role spoken for (cliente, dpo, utente). */
  role?: string;
  /** Human validations: the verdict. */
  verdict?: string;
}

export interface EvidenceConfig {
  enabled: boolean;
  kind: string;
  titleMaxChars: number;
  excerptMaxChars: number;
  interviewMaxChars: number;
  /** Lines of evidence shown in a person's reading of an idea. */
  readMax: number;
  signals: SignalBackendOptions & {
    cacheTtlMs: number;
    cacheMax: number;
    /** How long a result stays attachable, how many are kept per person. */
    allowTtlMs: number;
    allowMax: number;
    maxUrlChars: number;
    eventSnippetChars: number;
  };
  interview: { tier: string; maxOutputTokens: number; questionsMax: number; questionMaxChars: number; timeoutMs: number };
  validation: { commentMaxChars: number };
  /** Policy keys (Lorebase `Rule` records). */
  policies: {
    signalsPerPerson: string;
    signalsTotal: string;
    interviewsPerPerson: string;
    interviewsTotal: string;
    weightPublicSignal: string;
    weightWebSource: string;
    weightHuman: string;
    minReal: string;
    minSources: string;
    minHuman: string;
    minScore: string;
    committeeWeight: string;
    fullEvidence: string;
  };
}

/** The candidacy requirements in force (policies `requisiti_candidatura_*`). */
export interface Requirements {
  minReal: number;
  minSources: number;
  /** Human validations that are enough on their own (0: no such path). */
  minHuman: number;
  /** Minimum weighted score (0: none). */
  minScore: number;
}

export interface GateStatus {
  pass: boolean;
  real: number;
  sources: number;
  human: number;
  hypotheses: number;
  /** Requirements not met, as codes with the numbers (for the factual reasons). */
  missing: Array<{ code: 'real' | 'sources' | 'human' | 'score'; have: number; need: number }>;
}

/** Weight of a piece of evidence: simulated interviews always 0, the others from the policies. Pure. */
export function evidenceWeight(type: EvidenceType, w: { public_signal: number; web_source: number; human_validation: number }): number {
  if (type === 'simulated_interview') return 0;
  const v = w[type];
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

/** Real evidence: anything but a simulated interview, with a weight above 0. Pure. */
export const isReal = (e: Pick<Evidence, 'type' | 'weight'>) => e.type !== 'simulated_interview' && e.weight > 0;

/** Where an idea stands against the candidacy requirements. `score`: its weighted score (null without reviews). Pure. */
export function gateStatus(list: Evidence[], req: Requirements, score: number | null): GateStatus {
  const real = list.filter(isReal);
  const sources = new Set(real.map((e) => e.source)).size;
  const human = real.filter((e) => e.type === 'human_validation').length;
  const hypotheses = list.filter((e) => e.type === 'simulated_interview').length;
  const byEvidence = real.length >= req.minReal && sources >= req.minSources;
  const byHuman = req.minHuman > 0 && human >= req.minHuman;
  const scoreOk = !(req.minScore > 0) || (score ?? 0) >= req.minScore;
  const missing: GateStatus['missing'] = [];
  if (!byEvidence && !byHuman) {
    if (real.length < req.minReal) missing.push({ code: 'real', have: real.length, need: req.minReal });
    if (sources < req.minSources) missing.push({ code: 'sources', have: sources, need: req.minSources });
    if (req.minHuman > 0) missing.push({ code: 'human', have: human, need: req.minHuman });
  }
  if (!scoreOk) missing.push({ code: 'score', have: score ?? 0, need: req.minScore });
  return { pass: (byEvidence || byHuman) && scoreOk, real: real.length, sources, human, hypotheses, missing };
}

/** Evidence score 0-10: the sum of the weights against the sum that counts as full (policy). Pure. */
export function evidenceScore(list: Evidence[], full: number): number {
  const sum = list.reduce((s, e) => s + (isReal(e) ? e.weight : 0), 0);
  return full > 0 ? Math.round(Math.min(10, (sum / full) * 10) * 10) / 10 : 0;
}

/** The committee's score: the reviews' weighted score and the evidence score, mixed by the policy weight. Pure. */
export function committeeScore(reviews: number | null, evidence: number, weight: number): number | null {
  if (reviews === null) return null;
  const w = Math.max(0, Math.min(1, Number.isFinite(weight) ? weight : 0));
  return Math.round(((1 - w) * reviews + w * evidence) * 10) / 10;
}

/** The size of a result at its source and its name (points, stars, votes), from a signal result row. Pure. */
export function metricOf(source: string, row: Record<string, unknown>): { metric: number | null; metric_name: string } {
  const n = (k: string) => (typeof row[k] === 'number' ? (row[k] as number) : null);
  if (source === 'hackernews') return { metric: n('points'), metric_name: 'points' };
  if (source === 'github') return { metric: n('stars'), metric_name: 'stars' };
  if (source === 'stackoverflow') return { metric: n('score'), metric_name: 'votes' };
  return { metric: null, metric_name: '' };
}

/** The Lorebase row of a piece of evidence (kind `Evidence`). */
export function evidenceRow(e: Evidence, session: string): Record<string, unknown> {
  return {
    code: e.code, idea: e.idea, type: e.type, source: e.source, url: e.url, title: e.title, metric: e.metric ?? undefined, metric_name: e.metric_name, excerpt: e.excerpt,
    collected_by: e.collected_by, collected_at: e.collected_at, weight: e.weight, label: e.label, role: e.role ?? '', verdict: e.verdict ?? '', session,
  };
}

export function evidenceFromRecord(v: Record<string, unknown>): Evidence {
  const at = typeof v.collected_at === 'string' ? (() => { try { return JSON.parse(v.collected_at) as At; } catch { return { day: 0, minute: 0 }; } })() : (v.collected_at as At | undefined) ?? { day: 0, minute: 0 };
  const type = (EVIDENCE_TYPES as readonly string[]).includes(String(v.type)) ? (String(v.type) as EvidenceType) : 'web_source';
  return {
    code: String(v.code ?? ''), idea: String(v.idea ?? ''), type, source: (EVIDENCE_SOURCES as readonly string[]).includes(String(v.source)) ? (String(v.source) as EvidenceSource) : 'web',
    url: String(v.url ?? ''), title: String(v.title ?? ''), metric: v.metric === null || v.metric === undefined || v.metric === '' ? null : Number(v.metric), metric_name: String(v.metric_name ?? ''),
    excerpt: String(v.excerpt ?? ''), collected_by: String(v.collected_by ?? ''), collected_at: at, weight: type === 'simulated_interview' ? 0 : Number(v.weight ?? 0),
    label: type === 'simulated_interview' ? HYPOTHESIS : String(v.label ?? ''), ...(v.role ? { role: String(v.role) } : {}), ...(v.verdict ? { verdict: String(v.verdict) } : {}),
  };
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max) : '');

/** What a result looked like when it came back to a person (what `allega_prova` attaches). */
interface Seen {
  type: 'public_signal' | 'web_source';
  source: EvidenceSource;
  title: string;
  metric: number | null;
  metric_name: string;
  excerpt: string;
  expires: number;
}

/** One search of public signals, as the world reports it. */
export interface SignalEvent {
  tool: string;
  query: string;
  results: Array<{ title: string; url: string }>;
  snippets: string[];
  cached: boolean;
}

export interface EvidenceHost {
  /** Numeric value of a policy, undefined when it does not exist. */
  policy(key: string): number | undefined;
  day(): number;
  now(): At;
  /** Attaches a piece of evidence to an idea (persisted, announced); returns it or a refusal code. */
  attach(who: { id: string; name: string }, ev: Omit<Evidence, 'code' | 'collected_at'>): Evidence | string;
  /** Whether an idea exists and still takes evidence (refusal code otherwise). */
  ideaOpen(code: string): { code: string; title: string; problem: string; solution: string; users: string } | string;
  signaled(who: { id: string; name: string }, ev: SignalEvent): void;
  /** The model that answers simulated interviews (a scripted mock offline). */
  interviewModel(): string | ModelRef;
  /** A model run ended (cost booked to the person who asked). */
  ranModel(who: { id: string; name: string; model: string; tier: string }, res: { status: string; usage?: unknown; costUsd?: number }): void;
}

/** Italian tool name of each source. */
export const SIGNAL_TOOL: Record<SignalSourceName, string> = {
  hackernews: 'cerca_discussioni', github: 'cerca_progetti', stackoverflow: 'cerca_domande', arxiv: 'cerca_paper',
};

export class EvidenceDesk {
  private readonly cfg: EvidenceConfig;
  private readonly host: EvidenceHost;
  private readonly t: Translate;
  private readonly backend: SignalToolSet;
  private readonly cache = new Map<string, { expires: number; value: string }>();
  private readonly used = new Map<string, number>();
  private readonly seen = new Map<string, Map<string, Seen>>();
  readonly impl: string;
  readonly stats = { searches: 0, cached: 0, refused: 0, errors: 0, attached: 0, interviews: 0 };

  constructor(cfg: EvidenceConfig, host: EvidenceHost, t: Translate, backend: { impl: string; tools: SignalToolSet }) {
    this.cfg = cfg;
    this.host = host;
    this.t = t;
    this.backend = backend.tools;
    this.impl = backend.impl;
  }

  private num(key: string): number {
    const v = this.host.policy(key);
    return v !== undefined && Number.isFinite(v) ? v : 0;
  }

  /** Weights of the evidence types in force. */
  weights() {
    const p = this.cfg.policies;
    return { public_signal: this.num(p.weightPublicSignal), web_source: this.num(p.weightWebSource), human_validation: this.num(p.weightHuman) };
  }

  requirements(): Requirements {
    const p = this.cfg.policies;
    return { minReal: this.num(p.minReal), minSources: this.num(p.minSources), minHuman: this.num(p.minHuman), minScore: this.num(p.minScore) };
  }

  /** Policy weight of evidence in the committee's score, and the sum of weights that counts as full. */
  scoring(): { weight: number; full: number } {
    return { weight: this.num(this.cfg.policies.committeeWeight), full: this.num(this.cfg.policies.fullEvidence) };
  }

  /** Counts one call against the daily quotas, or returns the refusal code. */
  private take(name: string, kind: 'signal' | 'interview'): string | undefined {
    const p = this.cfg.policies;
    const day = this.host.day();
    const [per, total] = kind === 'signal' ? [p.signalsPerPerson, p.signalsTotal] : [p.interviewsPerPerson, p.interviewsTotal];
    const kAll = `${kind}\u0000${day}`;
    const kMe = `${kAll}\u0000${name}`;
    if ((this.used.get(kAll) ?? 0) >= this.num(total)) return `${kind}_total_quota`;
    if ((this.used.get(kMe) ?? 0) >= this.num(per)) return `${kind}_person_quota`;
    for (const k of [kAll, kMe]) this.used.set(k, (this.used.get(k) ?? 0) + 1);
    for (const k of this.used.keys()) if (Number(k.split('\u0000')[1]) < day) this.used.delete(k);
    return undefined;
  }

  /** Results that came back to a person (signal searches and web searches): they may become evidence. */
  remember(agentId: string, rows: Array<{ url: string } & Omit<Seen, 'expires'>>): void {
    const mine = this.seen.get(agentId) ?? new Map<string, Seen>();
    this.seen.set(agentId, mine);
    const expires = Date.now() + this.cfg.signals.allowTtlMs;
    for (const r of rows) {
      const url = normalizeFetchUrl(r.url, this.cfg.signals.maxUrlChars);
      if (!url) continue;
      mine.delete(url);
      mine.set(url, { ...r, expires });
    }
    const now = Date.now();
    for (const [k, v] of mine) if (v.expires <= now) mine.delete(k);
    while (mine.size > this.cfg.signals.allowMax) mine.delete(mine.keys().next().value!);
  }

  private refusal(reason: string) {
    this.stats.refused++;
    return { content: this.t('rt.act.evidenceFailed', { reason: this.reason(reason) }), isError: true as const };
  }

  reason(code: string): string {
    const key = `rt.evidenceReason.${code}`;
    const text = this.t(key);
    return text === key ? code : text;
  }

  private async search(who: { id: string; name: string }, source: SignalSourceName, args: Record<string, unknown>, ctx: Parameters<Tool['run']>[1]) {
    const inner = this.backend[SOURCE_TOOL[source]];
    if (!inner) return this.refusal('source_off');
    const query = clean(args.query, 300);
    if (!query) return this.refusal('empty');
    const n = Math.min(Number(args.max_results) || this.cfg.signals.maxResults, this.cfg.signals.maxResultsCap);
    const key = `${source}\u0000${n}\u0000${query.toLowerCase()}`;
    const hit = this.cache.get(key);
    let raw: string;
    let cached = false;
    if (hit && hit.expires > Date.now()) {
      raw = hit.value;
      cached = true;
      this.stats.cached++;
    } else {
      const quota = this.take(who.name, 'signal');
      if (quota) return this.refusal(quota);
      let out: unknown;
      try {
        out = await inner.run({ query, max_results: n }, ctx);
      } catch (err) {
        this.stats.errors++;
        return this.refusal(err instanceof Error && err.name === 'AbortError' ? 'aborted' : 'unavailable');
      }
      if (typeof out !== 'string') {
        this.stats.errors++;
        return this.refusal('unavailable');
      }
      raw = out;
      if (this.cfg.signals.cacheTtlMs > 0) {
        this.cache.set(key, { expires: Date.now() + this.cfg.signals.cacheTtlMs, value: raw });
        while (this.cache.size > this.cfg.signals.cacheMax) this.cache.delete(this.cache.keys().next().value!);
      }
    }
    this.stats.searches++;
    let body: { results?: Array<Record<string, unknown>> };
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      return raw;
    }
    const results = Array.isArray(body.results) ? body.results : [];
    const max = this.cfg.titleMaxChars;
    const titleOf = (r: Record<string, unknown>) => clean(r.title ?? r.name, max) || String(r.url ?? '');
    const excerptOf = (r: Record<string, unknown>) => clean(r.description ?? (Array.isArray(r.authors) ? (r.authors as string[]).join(', ') : ''), this.cfg.excerptMaxChars);
    const rows = results.flatMap((r) => {
      const base = { type: 'public_signal' as const, source: source as EvidenceSource, title: titleOf(r), ...metricOf(source, r), excerpt: excerptOf(r) };
      return [String(r.url ?? ''), ...(r.hn_url ? [String(r.hn_url)] : [])].filter(Boolean).map((url) => ({ url, ...base }));
    });
    this.remember(who.id, rows);
    const cut = (s: string) => s.slice(0, this.cfg.signals.eventSnippetChars);
    this.host.signaled(who, {
      tool: SIGNAL_TOOL[source], query, cached,
      results: results.map((r) => ({ title: titleOf(r), url: String(r.url ?? '') })),
      snippets: results.map((r) => { const m = metricOf(source, r); return cut(`${m.metric !== null ? `${m.metric_name} ${m.metric}. ` : ''}${excerptOf(r)}`); }),
    });
    return raw;
  }

  private attachTool(who: { id: string; name: string }, args: Record<string, unknown>) {
    const idea = clean(args.idea ?? args.code, 120);
    const url = normalizeFetchUrl(String(args.url ?? ''), this.cfg.signals.maxUrlChars);
    if (!idea) return this.refusal('no_idea');
    if (!url) return this.refusal('bad_url');
    const seen = this.seen.get(who.id)?.get(url);
    if (!seen || seen.expires <= Date.now()) return this.refusal('not_from_search');
    // What the source said wins over what the person writes; the person's words fill only what is missing.
    const metric = seen.metric ?? (Number.isFinite(Number(args.metrica)) && args.metrica !== undefined && args.metrica !== '' ? Number(args.metrica) : null);
    const out = this.host.attach(who, {
      idea, type: seen.type, source: seen.source, url, title: seen.title || clean(args.titolo, this.cfg.titleMaxChars) || url,
      metric, metric_name: seen.metric_name, excerpt: clean(args.estratto, this.cfg.excerptMaxChars) || seen.excerpt, collected_by: who.name,
      weight: evidenceWeight(seen.type, this.weights()), label: '',
    });
    if (typeof out === 'string') return this.refusal(out);
    this.stats.attached++;
    return this.t('rt.act.evidenceAttached', { idea: out.idea, type: this.t(`rt.evidenceType.${out.type}`), weight: out.weight });
  }

  private async interview(who: { id: string; name: string }, args: Record<string, unknown>, signal: AbortSignal) {
    const persona = String(args.persona ?? '').toLowerCase() as Persona;
    if (!PERSONAS.includes(persona)) return this.refusal('bad_persona');
    const raw = Array.isArray(args.domande) ? args.domande : typeof args.domande === 'string' ? [args.domande] : [];
    const questions = raw.map((q) => clean(q, this.cfg.interview.questionMaxChars)).filter(Boolean).slice(0, this.cfg.interview.questionsMax);
    if (!questions.length) return this.refusal('no_questions');
    const idea = this.host.ideaOpen(clean(args.idea ?? args.code, 120));
    if (typeof idea === 'string') return this.refusal(idea);
    const quota = this.take(who.name, 'interview');
    if (quota) return this.refusal(quota);
    const t = this.t;
    const model = this.host.interviewModel();
    const runner = agent({
      name: `${who.id}-interview`,
      model,
      params: { maxTokens: this.cfg.interview.maxOutputTokens },
      instructions: t('rt.interview.instructions', { persona: t(`rt.persona.${persona}`) }),
    });
    const prompt = t('rt.interview.prompt', { title: idea.title, problem: idea.problem || '-', users: idea.users || '-', solution: idea.solution || '-', questions: questions.map((q, i) => `${i + 1}. ${q}`).join('\n') });
    let res;
    try {
      res = await runner.run(prompt, { signal: AbortSignal.any([signal, AbortSignal.timeout(this.cfg.interview.timeoutMs)]) });
    } catch {
      this.stats.errors++;
      return this.refusal('unavailable');
    }
    this.host.ranModel({ id: `${who.id}:interview`, name: `${who.name}/intervista_simulata`, model: typeof model === 'string' ? model : model.model, tier: this.cfg.interview.tier }, res);
    const answer = clean(res.output, this.cfg.interviewMaxChars);
    if (res.status !== 'completed' || !answer) {
      this.stats.errors++;
      return this.refusal('unavailable');
    }
    const prefix = t('rt.interview.prefix', { persona: t(`rt.persona.${persona}`) });
    const excerpt = `${prefix} ${answer}`.slice(0, this.cfg.interviewMaxChars);
    const out = this.host.attach(who, {
      idea: idea.code, type: 'simulated_interview', source: 'persona', url: '', title: t('rt.interview.title', { persona: t(`rt.persona.${persona}`) }),
      metric: null, metric_name: '', excerpt, collected_by: who.name, weight: 0, label: HYPOTHESIS, role: persona,
    });
    if (typeof out === 'string') return this.refusal(out);
    this.stats.interviews++;
    return t('rt.act.interviewed', { text: excerpt });
  }

  /** The evidence tools of one person; `budget`: calls left to this decision (searches only). */
  tools(who: { id: string; name: string }, budget?: { left: number }): Tool[] {
    if (!this.cfg.enabled) return [];
    const t = this.t;
    const out: Tool[] = [];
    for (const source of this.cfg.signals.sources) {
      if (!this.backend[SOURCE_TOOL[source]]) continue;
      out.push(tool<Record<string, unknown>>(SIGNAL_TOOL[source], t(`rt.tools.signal.${source}`), {
        type: 'object',
        properties: { query: { type: 'string', description: t('rt.tools.signal.query') }, max_results: { type: 'integer', minimum: 1, maximum: this.cfg.signals.maxResultsCap } },
        required: ['query'],
      }, (args, ctx) => {
        if (budget) {
          if (budget.left <= 0) return this.refusal('decision_cap');
          budget.left--;
        }
        return this.search(who, source, args ?? {}, ctx);
      }, { risk: 'read' }));
    }
    out.push(tool<Record<string, unknown>>('allega_prova', t('rt.tools.evidence.attach'), {
      type: 'object',
      properties: {
        idea: { type: 'string', description: t('rt.tools.idea.code') },
        tipo: { enum: ['segnale_pubblico', 'fonte_web'], description: t('rt.tools.evidence.type') },
        url: { type: 'string', description: t('rt.tools.evidence.url') },
        titolo: { type: 'string', description: t('rt.tools.evidence.title') },
        metrica: { type: 'number', description: t('rt.tools.evidence.metric') },
        estratto: { type: 'string', description: t('rt.tools.evidence.excerpt') },
      },
      required: ['idea', 'tipo', 'url'],
    }, (args) => this.attachTool(who, args ?? {})));
    out.push(tool<Record<string, unknown>>('intervista_simulata', t('rt.tools.evidence.interview'), {
      type: 'object',
      properties: {
        idea: { type: 'string', description: t('rt.tools.idea.code') },
        persona: { enum: [...PERSONAS], description: t('rt.tools.evidence.persona') },
        domande: { type: 'array', items: { type: 'string' }, maxItems: this.cfg.interview.questionsMax, description: t('rt.tools.evidence.questions') },
      },
      required: ['idea', 'persona', 'domande'],
    }, (args, ctx) => this.interview(who, args ?? {}, ctx.signal)));
    return out;
  }
}
