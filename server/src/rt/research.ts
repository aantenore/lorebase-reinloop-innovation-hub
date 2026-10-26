// Web research for the people of the hub: reinloop's `web_search` / `web_fetch` behind a desk that applies the
// company policies (daily searches per person and in total, excluded domains), caches results server-side and
// reports every call as a `research` event. Web content is untrusted: it is only text handed back to the model,
// never an input to any write.
import { defineTool, type Tool, webTools } from 'reinloop';
import type { Translate } from '../i18n.ts';

export type ResearchProvider = 'tavily' | 'anthropic-native' | 'off';

export interface ResearchConfig {
  /** Search backend; `off` gives nobody the web tools. */
  provider: ResearchProvider;
  /** Results per search the backend returns (the model may ask for fewer, up to `maxResultsCap`). */
  maxResults: number;
  maxResultsCap: number;
  /** Characters kept per snippet and per fetched page (what the model reads). */
  maxChars: number;
  maxFetchChars: number;
  /** Server-side cache of results: lifetime and size. A cached answer does not count against the quotas. */
  cacheTtlMs: number;
  cacheMax: number;
  /** `anthropic-native` only: the model tier that runs the hosted search (resolved through sim.json `models`). */
  anthropicTier: string;
  /** `web_fetch` hardening: pages may only be read when they came back from the same agent's own searches. */
  fetch: {
    /** `search-results-only` (default) | `off` (the tool refuses every call). */
    mode: 'search-results-only' | 'off';
    /** How long a search result stays fetchable, how many are kept per agent, longest URL accepted. */
    allowTtlMs: number;
    allowMax: number;
    maxUrlChars: number;
  };
  /** Policy keys (Lorebase `Rule` records) behind the quotas and the excluded domains. */
  policies: { perPerson: string; total: string; excludedDomains: string };
  /** Snippets carried by an event (privileged clients only) and their length. */
  eventSnippetChars: number;
  /** Research kept per person for the inspector, and in the run's log (GET /api/research). */
  recentMax: number;
  logMax: number;
}

export interface ResearchSource {
  title: string;
  url: string;
}

/** One search or fetch, as the world reports it (`snippets` are for privileged clients only). */
export interface ResearchEvent {
  tool: 'web_search' | 'web_fetch';
  query?: string;
  url?: string;
  results: ResearchSource[];
  snippets: string[];
  cached: boolean;
}

export interface ResearchHost {
  /** The current value and text of a policy, undefined when it does not exist. */
  policy(key: string): { value: unknown; text: string } | undefined;
  /** Day of the world (quotas are per day). */
  day(): number;
  researched(who: { id: string; name: string }, ev: ResearchEvent): void;
}

type WebTools = { web_search: Tool; web_fetch?: Tool };

const DOMAIN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;

/** Domains named in a policy text (lower case). Pure. */
export function domainsIn(text: string): string[] {
  return [...new Set((text.match(DOMAIN) ?? []).map((d) => d.toLowerCase()))];
}

/** Whether `url` is on one of `domains` (the domain itself or a subdomain). Pure. */
export function excluded(url: string, domains: string[]): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

const PRIVATE_HOST = /(^|\.)(localhost|local|internal|localdomain|lan|home\.arpa)$/;
const IPV4_LIKE = /^[0-9a-fx.]+$/;

/**
 * The canonical form of a URL a page may be fetched from, or undefined when it must never be: only http(s), no
 * credentials, no IP literals (which covers private and link-local ranges), no localhost / `.local` / `.internal` /
 * single-label hosts, no URL longer than `maxChars`. The fragment is dropped. Pure.
 */
export function normalizeFetchUrl(raw: string, maxChars: number): string | undefined {
  const input = raw.trim();
  if (!input || input.length > maxChars) return undefined;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return undefined;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
  if (u.username || u.password) return undefined;
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') || host.startsWith('[') || IPV4_LIKE.test(host) || PRIVATE_HOST.test(host)) return undefined;
  u.hash = '';
  const out = u.toString();
  return out.length > maxChars ? undefined : out;
}

const text = (out: unknown): string => (typeof out === 'string' ? out : String((out as { content?: unknown })?.content ?? ''));
const isErr = (out: unknown): boolean => typeof out === 'object' && !!out && (out as { isError?: boolean }).isError === true;

export class ResearchDesk {
  private readonly cfg: ResearchConfig;
  private readonly host: ResearchHost;
  private readonly t: Translate;
  private readonly web: WebTools;
  private readonly cache = new Map<string, { expires: number; value: string }>();
  /** Calls that reached the backend, per day and per person. */
  private readonly used = new Map<string, number>();
  /** Per agent: the normalized URLs its own searches returned, with their expiry (what `web_fetch` may read). */
  private readonly allowed = new Map<string, Map<string, number>>();
  readonly stats = { searches: 0, fetches: 0, cached: 0, refused: 0, errors: 0 };

  constructor(cfg: ResearchConfig, host: ResearchHost, t: Translate, web: WebTools) {
    this.cfg = cfg;
    this.host = host;
    this.t = t;
    this.web = web;
  }

  /** The desk for a configuration, or undefined when research is off or the backend cannot be built (logged). */
  static create(cfg: ResearchConfig | undefined, host: ResearchHost, t: Translate, models: Record<string, string>): ResearchDesk | undefined {
    if (!cfg || cfg.provider === 'off') return undefined;
    try {
      const web = webTools({
        provider: cfg.provider,
        ...(cfg.provider === 'anthropic-native' ? { anthropic: { model: models[cfg.anthropicTier] ?? cfg.anthropicTier } } : {}),
        maxResults: cfg.maxResults, maxResultsCap: cfg.maxResultsCap, maxChars: cfg.maxChars, maxFetchChars: cfg.maxFetchChars,
      });
      return new ResearchDesk(cfg, host, t, web);
    } catch (err) {
      console.warn(`[research] off: ${err instanceof Error ? err.message : String(err)}`);
      return undefined;
    }
  }

  private num(key: string): number {
    const v = Number(this.host.policy(key)?.value);
    return Number.isFinite(v) ? v : 0;
  }

  private domains(): string[] {
    const p = this.host.policy(this.cfg.policies.excludedDomains);
    return p ? domainsIn(p.text) : [];
  }

  /** Why a person may not reach the backend now (a refusal reason code), or undefined. */
  private quotaError(name: string): string | undefined {
    const day = this.host.day();
    if ((this.used.get(`${day}`) ?? 0) >= this.num(this.cfg.policies.total)) return 'total_quota';
    if ((this.used.get(`${day}\u0000${name}`) ?? 0) >= this.num(this.cfg.policies.perPerson)) return 'person_quota';
    return undefined;
  }

  private count(name: string): void {
    const day = this.host.day();
    for (const k of [`${day}`, `${day}\u0000${name}`]) this.used.set(k, (this.used.get(k) ?? 0) + 1);
    // Older days are not needed any more.
    for (const k of this.used.keys()) if (Number(k.split('\u0000')[0]) < day) this.used.delete(k);
  }

  private cached(key: string): string | undefined {
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    if (hit) this.cache.delete(key);
    return undefined;
  }

  private store(key: string, value: string): void {
    if (this.cfg.cacheTtlMs <= 0) return;
    this.cache.set(key, { expires: Date.now() + this.cfg.cacheTtlMs, value });
    while (this.cache.size > this.cfg.cacheMax) this.cache.delete(this.cache.keys().next().value!);
  }

  private allow(agentId: string, urls: string[]): void {
    const mine = this.allowed.get(agentId) ?? new Map<string, number>();
    this.allowed.set(agentId, mine);
    const expires = Date.now() + this.cfg.fetch.allowTtlMs;
    for (const url of urls) {
      const n = normalizeFetchUrl(url, this.cfg.fetch.maxUrlChars);
      if (!n) continue;
      mine.delete(n);
      mine.set(n, expires);
    }
    const now = Date.now();
    for (const [k, exp] of mine) if (exp <= now) mine.delete(k);
    while (mine.size > this.cfg.fetch.allowMax) mine.delete(mine.keys().next().value!);
  }

  private isAllowed(agentId: string, url: string): boolean {
    return (this.allowed.get(agentId)?.get(url) ?? 0) > Date.now();
  }

  /** Runs one call through the cache, the quotas and the backend; returns the content for the model. */
  private async call(who: { id: string; name: string }, tool: Tool, kind: ResearchEvent['tool'], args: Record<string, unknown>, ctx: Parameters<Tool['run']>[1]): Promise<string | { content: string; isError: true }> {
    let target = kind === 'web_search' ? String(args.query ?? '').trim() : String(args.url ?? '').trim();
    const refuse = (reason: string) => {
      this.stats.refused++;
      return { content: this.t('rt.act.researchFailed', { reason: this.t(`rt.researchReason.${reason}`) }), isError: true as const };
    };
    if (!target) return refuse('empty');
    const domains = this.domains();
    if (kind === 'web_fetch') {
      if (this.cfg.fetch.mode === 'off') return refuse('fetch_off');
      if (excluded(target, domains)) return refuse('excluded_domain');
      // Only pages this agent's own searches returned, byte for byte (query string included): nothing the model
      // composes, or a page tells it to compose, can reach another host.
      const url = normalizeFetchUrl(target, this.cfg.fetch.maxUrlChars);
      if (!url || !this.isAllowed(who.id, url)) return refuse('not_from_search');
      target = url;
      args = { ...args, url };
    }
    const key = `${kind}\u0000${args.max_results ?? ''}\u0000${target}`;
    let raw = this.cached(key);
    const cached = raw !== undefined;
    if (!cached) {
      const quota = this.quotaError(who.name);
      if (quota) return refuse(quota);
      this.count(who.name);
      try {
        const out = await tool.run(args, ctx);
        if (isErr(out)) {
          this.stats.errors++;
          return { content: text(out), isError: true };
        }
        raw = text(out);
      } catch (err) {
        this.stats.errors++;
        return refuse(err instanceof Error && err.name === 'AbortError' ? 'aborted' : 'unavailable');
      }
      this.store(key, raw);
    } else this.stats.cached++;
    if (kind === 'web_search') this.stats.searches++;
    else this.stats.fetches++;
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw!) as Record<string, unknown>;
    } catch {
      return raw!;
    }
    const all = Array.isArray(body.results) ? (body.results as Array<Record<string, unknown>>) : [];
    const results = all.filter((r) => !excluded(String(r.url ?? ''), domains));
    if (Array.isArray(body.results)) body.results = results;
    if (kind === 'web_search') this.allow(who.id, results.map((r) => String(r.url ?? '')));
    const cut = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').slice(0, this.cfg.eventSnippetChars);
    this.host.researched(who, {
      tool: kind,
      ...(kind === 'web_search' ? { query: target } : { url: target }),
      results: kind === 'web_search' ? results.map((r) => ({ title: String(r.title ?? ''), url: String(r.url ?? '') })) : [{ title: String(body.title ?? ''), url: target }],
      snippets: kind === 'web_search' ? results.map((r) => cut(r.snippet)) : [cut(body.content)],
      cached,
    });
    return JSON.stringify(body);
  }

  /** The web tools of one person (same names and schemas as reinloop's, descriptions in the world's language). */
  tools(who: { id: string; name: string }): Tool[] {
    const wrap = (inner: Tool, kind: ResearchEvent['tool']) => defineTool<Record<string, unknown>>({
      name: inner.name,
      description: this.t(`rt.tools.${kind}`),
      schema: inner.schema,
      risk: 'read',
      run: (args, ctx) => this.call(who, inner, kind, args ?? {}, ctx),
    });
    return [wrap(this.web.web_search, 'web_search'), ...(this.web.web_fetch ? [wrap(this.web.web_fetch, 'web_fetch')] : [])];
  }
}
