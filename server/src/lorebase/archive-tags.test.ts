import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planArchiveToTags } from './archive-tags.ts';
import { LorebaseClient } from './client.ts';

test('plans archive/ branches, skipping protected ones and names that are already tags', () => {
  const branches = [
    { name: 'main', head: 'r0', protected: true },
    { name: 'archive/a', head: 'r1', protected: false },
    { name: 'archive/b', head: 'r2' },
    { name: 'archive/p', head: 'r3', protected: true },
  ];
  assert.deepEqual(planArchiveToTags(branches, [{ name: 'archive/b' }]), [
    { name: 'archive/a', head: 'r1' },
    { name: 'archive/b', head: 'r2', skip: 'tagged' },
    { name: 'archive/p', head: 'r3', skip: 'protected' },
  ]);
});

test('client creates a tag at a branch head and lists tags across pages', async () => {
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ method: String(init.method), url, body: init.body as string | undefined });
    const body = init.method === 'POST' ? { name: 'archive/x', revision: 'r1' } : url.includes('cursor=c1') ? { items: [{ name: 'b', revision: 'r2' }] } : { items: [{ name: 'a', revision: 'r1' }], next_cursor: 'c1' };
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  try {
    const c = new LorebaseClient('http://k', 'hub');
    await c.createTag('archive/x', { revision: 'r9' });
    assert.equal(calls[0]?.url, 'http://k/api/v1/domains/hub/tags');
    assert.deepEqual(JSON.parse(calls[0]?.body ?? ''), { name: 'archive/x', revision: 'r9' });
    assert.deepEqual((await c.listTags()).map((t) => t.name), ['a', 'b']);
  } finally {
    globalThis.fetch = real;
  }
});
