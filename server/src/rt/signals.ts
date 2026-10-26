// Public signals: what people out there discuss (Hacker News), build (GitHub), ask (Stack Overflow) and publish
// (arXiv), through reinloop's `signalTools` (one tool per source, `{query, max_results?}` in, compact JSON marked
// untrusted out). Offline, the same tools run on deterministic mock sources (URLs under example.org).
import { type SignalItem, type SignalSource, signalTools, type Tool } from 'reinloop';

export type SignalSourceName = 'hackernews' | 'github' | 'stackoverflow' | 'arxiv';

export interface SignalBackendOptions {
  sources: SignalSourceName[];
  maxResults: number;
  maxResultsCap: number;
  maxChars: number;
  timeoutMs: number;
  /** Empty: reinloop's default User-Agent. */
  userAgent?: string;
  /**
   * Hacker News (Algolia): a story must contain every word of the query; with `partialMatch` on, a query that finds
   * nothing is asked again with every word optional (Algolia `optionalWords`, no typo tolerance), and those results carry
   * `match: "partial"`.
   */
  hackernews?: { partialMatch: boolean };
}

/** The tools of a signal backend, keyed by reinloop's tool names (search_discussions, ...). */
export type SignalToolSet = Record<string, Tool | undefined>;

/** reinloop tool name of each source (the hub gives them Italian names of its own). */
export const SOURCE_TOOL: Record<SignalSourceName, string> = {
  hackernews: 'search_discussions', github: 'search_projects', stackoverflow: 'search_questions', arxiv: 'search_papers',
};

const slugOf = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'q';

/** The URL of the i-th offline result of a query (the mock minds attach it). Pure. */
export function mockSignalUrl(source: SignalSourceName, query: string, i = 0): string {
  return `https://example.org/mock/${source}/${slugOf(query)}/${i + 1}`;
}

/** Deterministic offline results: the same query gives the same items. Pure. */
export function mockSignalItems(source: SignalSourceName, query: string, n: number): SignalItem[] {
  const h = [...`${source}${query}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return Array.from({ length: Math.max(1, Math.min(n, 3)) }, (_, i) => {
    const url = mockSignalUrl(source, query, i);
    const m = ((h >> (i * 3)) % 400) + 10;
    if (source === 'hackernews') return { title: `${query} (${i + 1})`, url, points: m, comments: Math.floor(m / 4), hn_url: url };
    if (source === 'github') return { name: `mock/${slugOf(query)}-${i + 1}`, url, stars: m * 10, open_issues: m % 40, description: query };
    if (source === 'stackoverflow') return { title: `${query}? (${i + 1})`, url, score: m % 90, answer_count: i + 1, is_answered: true };
    return { title: `${query}: a study (${i + 1})`, url, published: '2026-01-01T00:00:00Z', authors: ['A. Rossi'] };
  });
}

function mockSource(source: SignalSourceName): SignalSource {
  return { name: source, tool: SOURCE_TOOL[source], description: `Offline ${source} results.`, search: async (query, { maxResults }) => mockSignalItems(source, query, maxResults) };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const plain = (s: unknown, max: number) => String(s ?? '')
  .replace(/&(#\d+|[a-z]+);/gi, (m, e: string) => (e[0] === '#' ? String.fromCodePoint(Number(e.slice(1)) || 32) : ENTITIES[e.toLowerCase()] ?? m))
  .replace(/\s+/g, ' ').trim().slice(0, max);

/** The words of a query as Algolia sees them (for `optionalWords`). Pure. */
export function queryWords(query: string): string[] {
  return query.split(/[\s,;]+/).map((w) => w.trim()).filter(Boolean);
}

/**
 * Hacker News stories through the Algolia HN API, like reinloop's source, plus the partial-match fallback: when no story
 * contains every word, the same query with every word optional (ranked by how many words match), results marked partial.
 */
export function hackerNewsSource(partialMatch: boolean): SignalSource {
  return {
    name: 'hackernews',
    tool: SOURCE_TOOL.hackernews,
    description: 'Search Hacker News stories (Algolia HN API, English-language content).',
    async search(query, { maxResults, get, maxChars }) {
      const base = { query, tags: 'story', hitsPerPage: String(maxResults) };
      const url = (p: Record<string, string>) => `https://hn.algolia.com/api/v1/search?${new URLSearchParams(p)}`;
      let hits = ((await get(url(base))) as { hits?: Array<Record<string, unknown>> } | undefined)?.hits ?? [];
      const words = queryWords(query);
      let partial = false;
      if (!hits.length && partialMatch && words.length > 1) {
        hits = ((await get(url({ ...base, optionalWords: words.join(' '), typoTolerance: 'false' }))) as { hits?: Array<Record<string, unknown>> } | undefined)?.hits ?? [];
        partial = hits.length > 0;
      }
      return hits.map((h) => ({
        title: plain(h.title, maxChars),
        url: typeof h.url === 'string' && h.url ? h.url : `https://news.ycombinator.com/item?id=${String(h.objectID)}`,
        points: Number(h.points ?? 0),
        comments: Number(h.num_comments ?? 0),
        created_at: String(h.created_at ?? ''),
        hn_url: `https://news.ycombinator.com/item?id=${String(h.objectID)}`,
        ...(partial ? { match: 'partial' } : {}),
      }));
    },
  };
}

/** The signal tools (reinloop `signalTools`), on mock sources offline. */
export function signalBackend(opts: SignalBackendOptions, mock: boolean): { impl: 'reinloop' | 'mock'; tools: SignalToolSet } {
  const real = (s: SignalSourceName): SignalSourceName | SignalSource => (s === 'hackernews' && opts.hackernews ? hackerNewsSource(opts.hackernews.partialMatch) : s);
  const tools = signalTools({
    sources: mock ? opts.sources.map(mockSource) : opts.sources.map(real),
    maxResults: opts.maxResults, maxResultsCap: opts.maxResultsCap, maxChars: opts.maxChars, timeoutMs: opts.timeoutMs,
    ...(opts.userAgent ? { userAgent: opts.userAgent } : {}),
  });
  return { impl: mock ? 'mock' : 'reinloop', tools: tools as SignalToolSet };
}
