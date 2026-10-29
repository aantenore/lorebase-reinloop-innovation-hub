import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planArchiveToTags } from './archive-tags.ts';
import { LorebaseClient } from './client.ts';

test('plans only archive/ branches, skips existing tags, flags conflicts', () => {
  const branches = [
    { name: 'main', head: 'r0' },
    { name: 'archive/a', head: 'r1' },
    { name: 'archive/b', head: 'r2' },
    { name: 'archive/c', head: 'r3' },
  ];
  const tags = [
    { name: 'archive/b', revision: 'r2' },
    { name: 'archive/c', revision: 'other' },
  ];
  assert.deepEqual(planArchiveToTags(branches, tags), [
    { name: 'archive/a', head: 'r1', createTag: true, conflict: false },
    { name: 'archive/b', head: 'r2', createTag: false, conflict: false },
    { name: 'archive/c', head: 'r3', createTag: false, conflict: true },
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
    await c.createTag('archive/x', 'main');
    assert.equal(calls[0]?.url, 'http://k/api/v1/domains/hub/tags');
    assert.deepEqual(JSON.parse(calls[0]?.body ?? ''), { name: 'archive/x', source: 'main' });
    assert.deepEqual((await c.listTags()).map((t) => t.name), ['a', 'b']);
  } finally {
    globalThis.fetch = real;
  }
});
