// A player in the hub validates an idea: joins the world over WebSocket, walks to the nearest person of the hub
// and posts a validation (POST /api/ideas/:code/validation) as customer, DPO or user. For demos and smoke runs.
//   node scripts/validate-idea.ts [--name Antonio] [--role cliente] [--verdict positivo] [--comment "..."] [--idea <code>] [--wait 120]
import WebSocket from 'ws';
import { loadConfig } from '../server/src/config.ts';
import { loadGameConfig } from '../server/src/rt/config.ts';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : d;
};
const cfg = loadConfig([]);
const game = loadGameConfig();
const base = `http://127.0.0.1:${cfg.http.port}`;
const token = process.env.SIM_API_TOKEN;
const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const deadline = Date.now() + Number(arg('wait', '120')) * 1000;
const ws = new WebSocket(`ws://127.0.0.1:${cfg.http.port}${game.ws.path}`);
const pos = new Map<string, { x: number; y: number; kind: string; name: string }>();
let me = '';
let done = false;

const finish = (code: number, text: string) => {
  if (done) return;
  done = true;
  console.log(text);
  ws.close();
  process.exit(code);
};

ws.on('open', () => ws.send(JSON.stringify({ type: 'join', name: arg('name', 'Antonio'), role: 'player', ...(token ? { token } : {}) })));
ws.on('message', async (raw) => {
  const m = JSON.parse(String(raw)) as Record<string, any>;
  if (m.type === 'hello') {
    me = m.you?.entityId ?? me;
    for (const e of m.entities ?? []) pos.set(e.id, { x: e.x, y: e.y, kind: e.kind, name: e.name });
  } else if (m.type === 'entity_added') pos.set(m.entity.id, { x: m.entity.x, y: m.entity.y, kind: m.entity.kind, name: m.entity.name });
  else if (m.type === 'state') for (const d of m.entities ?? []) {
    const p = pos.get(d.id);
    if (p && typeof d.x === 'number') Object.assign(p, { x: d.x, y: d.y });
  }
  if (!me || done) return;
  if (Date.now() > deadline) finish(1, 'no idea validated in time');
  const self = pos.get(me);
  if (!self) return;
  const agents = [...pos.entries()].filter(([, p]) => p.kind === 'agent').map(([id, p]) => ({ id, ...p, d: Math.hypot(p.x - self.x, p.y - self.y) })).sort((a, b) => a.d - b.d);
  const near = agents[0];
  if (!near) return;
  if (near.d > 2) {
    ws.send(JSON.stringify({ type: 'input', dx: (near.x - self.x) / near.d, dy: (near.y - self.y) / near.d }));
    return;
  }
  ws.send(JSON.stringify({ type: 'input', dx: 0, dy: 0 }));
  const ideas = (await (await fetch(`${base}/api/ideas`)).json()) as Array<{ code: string; title: string; stage: string; champion: string; authors: string[] }>;
  const open = ideas.filter((i) => ['concept', 'proposal', 'insight', 'signal'].includes(i.stage));
  const pick = open.find((i) => i.code === arg('idea', '')) ?? open.find((i) => i.champion === near.name || i.authors.includes(near.name)) ?? open[0];
  if (!pick || done) return;
  done = true;
  const res = await fetch(`${base}/api/ideas/${encodeURIComponent(pick.code)}/validation`, {
    method: 'POST', headers, body: JSON.stringify({ player: me, role: arg('role', 'cliente'), verdict: arg('verdict', 'positivo'), comment: arg('comment', '') }),
  });
  const body = await res.json();
  console.log(`${res.status} ${pick.title} (near ${near.name}): ${JSON.stringify(body).slice(0, 300)}`);
  ws.close();
  process.exit(res.ok ? 0 : 1);
});
ws.on('error', (err) => finish(1, `ws error: ${err.message}`));
