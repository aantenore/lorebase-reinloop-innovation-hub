import assert from 'node:assert/strict';
import { test } from 'node:test';
import { committeeScore, type Evidence, evidenceFromRecord, evidenceRow, evidenceScore, evidenceWeight, gateStatus, metricOf } from './evidence.ts';

const at = { day: 1, minute: 600 };
const ev = (type: Evidence['type'], source: Evidence['source'], weight: number, url = ''): Evidence => ({
  code: `c${Math.random()}`, idea: 'i', type, source, url, title: 't', metric: null, metric_name: '', excerpt: '', collected_by: 'x', collected_at: at, weight, label: '',
});
const req = { minReal: 3, minSources: 2, minHuman: 1, minScore: 0 };

test('evidence: simulated interviews always weigh 0; the others weigh what the policies say', () => {
  const w = { public_signal: 1, web_source: 0.5, human_validation: 2 };
  assert.equal(evidenceWeight('simulated_interview', w), 0);
  assert.equal(evidenceWeight('public_signal', w), 1);
  assert.equal(evidenceWeight('human_validation', { ...w, human_validation: -1 }), 0);
  const back = evidenceFromRecord(evidenceRow({ ...ev('simulated_interview', 'persona', 5), label: '' }, 's'));
  assert.equal(back.weight, 0);
  assert.equal(back.label, 'ipotesi');
});

test('evidence: the gate counts real evidence and distinct sources, or human validations instead, and says what is missing', () => {
  const two = [ev('public_signal', 'hackernews', 1), ev('public_signal', 'hackernews', 1), ev('simulated_interview', 'persona', 0)];
  const g = gateStatus(two, req, 6);
  assert.equal(g.pass, false);
  assert.deepEqual(g.missing.map((m) => `${m.code} ${m.have}/${m.need}`), ['real 2/3', 'sources 1/2', 'human 0/1']);
  assert.equal(g.hypotheses, 1);
  assert.equal(gateStatus([...two, ev('web_source', 'web', 0.5)], req, 6).pass, true);
  assert.equal(gateStatus([ev('human_validation', 'player', 2)], req, 6).pass, true);
  assert.equal(gateStatus([ev('human_validation', 'player', 2)], { ...req, minHuman: 0 }, 6).pass, false);
  assert.deepEqual(gateStatus([ev('human_validation', 'player', 2)], { ...req, minScore: 7 }, 6).missing, [{ code: 'score', have: 6, need: 7 }]);
});

test('evidence: committee score mixes reviews and evidence by policy; metrics come from the source fields', () => {
  const list = [ev('public_signal', 'github', 1), ev('human_validation', 'player', 2), ev('simulated_interview', 'persona', 0)];
  assert.equal(evidenceScore(list, 6), 5);
  assert.equal(evidenceScore(list, 2), 10);
  assert.equal(committeeScore(8, 5, 0.3), 7.1);
  assert.equal(committeeScore(null, 5, 0.3), null);
  assert.deepEqual(metricOf('github', { stars: 120 }), { metric: 120, metric_name: 'stars' });
  assert.deepEqual(metricOf('arxiv', {}), { metric: null, metric_name: '' });
});

test('evidence desk: only URLs from the person\'s own searches become evidence, with the source metric; quotas from policies', async () => {
  const { EvidenceDesk } = await import('./evidence.ts');
  const { signalBackend, mockSignalUrl } = await import('./signals.ts');
  const policies: Record<string, number> = { sp: 1, st: 5, ip: 0, it: 0, w1: 1, w2: 0.5, w3: 2 };
  const attached: unknown[] = [];
  const cfg = {
    enabled: true, kind: 'Evidence', titleMaxChars: 120, excerptMaxChars: 200, interviewMaxChars: 600, readMax: 5,
    signals: { sources: ['hackernews' as const], maxResults: 3, maxResultsCap: 5, maxChars: 200, timeoutMs: 1000, cacheTtlMs: 60000, cacheMax: 10, allowTtlMs: 60000, allowMax: 10, maxUrlChars: 512, eventSnippetChars: 50 },
    interview: { tier: 'haiku', maxOutputTokens: 100, questionsMax: 2, questionMaxChars: 100, timeoutMs: 1000 },
    validation: { commentMaxChars: 100 },
    policies: { signalsPerPerson: 'sp', signalsTotal: 'st', interviewsPerPerson: 'ip', interviewsTotal: 'it', weightPublicSignal: 'w1', weightWebSource: 'w2', weightHuman: 'w3', minReal: 'a', minSources: 'b', minHuman: 'c', minScore: 'd', committeeWeight: 'e', fullEvidence: 'f' },
  };
  const desk = new EvidenceDesk(cfg, {
    policy: (k) => policies[k], day: () => 1, now: () => at, ideaOpen: () => 'unknown_idea', signaled: () => undefined, interviewModel: () => 'x', ranModel: () => undefined,
    attach: (_who, e) => (attached.push(e), { ...e, code: 'c', collected_at: at }),
  }, (k, v) => (v ? `${k} ${JSON.stringify(v)}` : k), signalBackend(cfg.signals, true));
  const who = { id: 'a1', name: 'Dario' };
  const [search, attach, interview] = desk.tools(who);
  const ctx = { signal: new AbortController().signal } as Parameters<NonNullable<typeof search>['run']>[1];
  assert.equal(String(await attach!.run({ idea: 'i', tipo: 'segnale_pubblico', url: mockSignalUrl('hackernews', 'audit ai') }, ctx) && (attached.length)), '0');
  const out = await search!.run({ query: 'audit ai' }, ctx);
  assert.ok(String(out).includes('"untrusted":true'));
  await attach!.run({ idea: 'i', tipo: 'fonte_web', url: mockSignalUrl('hackernews', 'audit ai'), metrica: 99999 }, ctx);
  assert.equal(attached.length, 1);
  const e = attached[0] as { type: string; metric: number; weight: number; source: string };
  assert.equal(e.type, 'public_signal');
  assert.equal(e.source, 'hackernews');
  assert.notEqual(e.metric, 99999);
  assert.equal(e.weight, 1);
  // Cached: free. A new query: over the personal quota (1).
  await search!.run({ query: 'audit ai' }, ctx);
  const refused = await search!.run({ query: 'altro' }, ctx) as { isError?: boolean; content: string };
  assert.equal(refused.isError, true);
  assert.ok(refused.content.includes('signal_person_quota'));
  const noQuota = await interview!.run({ idea: 'i', persona: 'cliente', domande: ['?'] }, ctx) as { isError?: boolean };
  assert.equal(noQuota.isError, true);
});
