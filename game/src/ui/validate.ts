import { config } from '../config';
import { t, type I18nKey } from '../i18n';
import { requestJson } from '../net/http';
import type { Idea, ValidationRequest, ValidationResponse, ValidationRole, ValidationVerdict } from '../net/protocol';
import { store } from '../state/store';
import { bus } from './bus';
import { h, throttle, uiRoot } from './dom';

const ROLES: ValidationRole[] = ['cliente', 'dpo', 'utente'];
const VERDICTS: ValidationVerdict[] = ['positivo', 'neutro', 'negativo'];

/** Server error text out of a `requestJson` failure (`<status> <body>`), falling back to the raw message. */
function errorText(err: unknown): string {
  const msg = (err as Error).message ?? String(err);
  const body = msg.replace(/^\d+\s+/, '');
  try {
    const j = JSON.parse(body) as { error?: string };
    if (j.error) return j.error;
  } catch {
    /* plain text */
  }
  return body || msg;
}

/** Speech radius (tiles) from the world rules, with a configured fallback. */
function speechRadius(): number {
  const v = Number(store.rules.get('speech_radius')?.value);
  return Number.isFinite(v) && v > 0 ? v : config.hub.speechRadiusFallback;
}

/** Nearest living non-player entity within speech radius of the local player (null when none or not joined). */
function nearestAgent() {
  const you = store.you();
  if (!you) return null;
  const radius = speechRadius();
  let best: { id: string; name: string } | null = null;
  let bestD = Infinity;
  for (const e of store.entities.values()) {
    if (e.id === you.id || !e.alive || e.kind === 'player') continue;
    const d = Math.hypot(e.x - you.x, e.y - you.y);
    if (d <= radius && d < bestD) {
      bestD = d;
      best = { id: e.id, name: e.name };
    }
  }
  return best;
}

/** Ideas that can still be validated; those tied to `agentName` come first. */
function candidates(agentName: string | null): Idea[] {
  const open = [...store.ideas.values()].filter((i) => i.stage !== 'approved' && i.stage !== 'killed');
  const mine = (i: Idea) => !!agentName && (i.champion === agentName || i.authors.includes(agentName));
  return [...open.filter(mine), ...open.filter((i) => !mine(i))];
}

/** "Valida idea": visible only when the joined player stands within speech radius of an agent. */
export function mountValidatePanel(): void {
  const near = h('div', { class: 'note' });
  const ideaSel = h('select', { class: 'field' }) as HTMLSelectElement;
  const roleSel = h('select', { class: 'field' }, ROLES.map((r) => h('option', { value: r }, t(`val.role.${r}` as I18nKey)))) as HTMLSelectElement;
  const verdictSel = h('select', { class: 'field' }, VERDICTS.map((v) => h('option', { value: v }, t(`val.verdict.${v}` as I18nKey)))) as HTMLSelectElement;
  const comment = h('textarea', { class: 'field val-comment', maxlength: config.hub.validationCommentMax, rows: 3 }) as HTMLTextAreaElement;
  const status = h('div', { class: 'note' });
  const send = h('button', { class: 'btn primary' }, t('val.send')) as HTMLButtonElement;
  const label = (k: I18nKey, el: HTMLElement) => h('div', {}, h('label', {}, t(k)), el);
  const el = h(
    'div',
    { class: 'px panel validate hidden' },
    h('div', { class: 'px-title' }, t('val.title')),
    near,
    label('val.idea', ideaSel),
    label('val.role', roleSel),
    label('val.verdict', verdictSel),
    label('val.comment', comment),
    h('div', { class: 'actions' }, send),
    status,
  );
  uiRoot().append(el);
  comment.addEventListener('keydown', (ev) => ev.stopPropagation());

  let ideasKey = '';
  const refresh = () => {
    const agent = nearestAgent();
    el.classList.toggle('hidden', !agent);
    if (!agent) return;
    near.textContent = t('val.near', { name: agent.name });
    const list = candidates(agent.name);
    const key = `${agent.name}|${list.map((i) => i.code).join(',')}`;
    if (key === ideasKey) return;
    ideasKey = key;
    const keep = ideaSel.value;
    ideaSel.replaceChildren(...list.map((i) => h('option', { value: i.code }, `${i.code} · ${i.title}`)));
    if (list.some((i) => i.code === keep)) ideaSel.value = keep;
    send.disabled = !list.length;
    if (!list.length) status.textContent = t('val.noIdeas');
  };
  const schedule = throttle(refresh, 300);
  store.on('any', schedule);
  store.on('hello', refresh);

  send.addEventListener('click', async () => {
    const code = ideaSel.value;
    const player = store.youId;
    if (!code || !player) return;
    const body: ValidationRequest = { player, role: roleSel.value as ValidationRole, verdict: verdictSel.value as ValidationVerdict, comment: comment.value.trim().slice(0, config.hub.validationCommentMax) };
    send.disabled = true;
    status.textContent = t('val.sending');
    try {
      const res = await requestJson<ValidationResponse>('POST', `/ideas/${encodeURIComponent(code)}/validation`, body);
      if (res.ok === false) throw new Error(res.error ?? '');
      status.textContent = t('val.ok');
      comment.value = '';
      bus.emit('toast', { text: t('val.ok') });
    } catch (err) {
      status.textContent = t('val.err', { err: errorText(err) });
    } finally {
      send.disabled = false;
    }
  });
}
