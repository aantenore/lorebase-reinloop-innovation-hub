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

/** The signal tools (reinloop `signalTools`), on mock sources offline. */
export function signalBackend(opts: SignalBackendOptions, mock: boolean): { impl: 'reinloop' | 'mock'; tools: SignalToolSet } {
  const tools = signalTools({
    sources: mock ? opts.sources.map(mockSource) : opts.sources,
    maxResults: opts.maxResults, maxResultsCap: opts.maxResultsCap, maxChars: opts.maxChars, timeoutMs: opts.timeoutMs,
    ...(opts.userAgent ? { userAgent: opts.userAgent } : {}),
  });
  return { impl: mock ? 'mock' : 'reinloop', tools: tools as SignalToolSet };
}
