import { t, type I18nKey } from '../i18n';
import type { Evidence, EvidenceType, Idea } from '../net/protocol';
import { fmtClock, h, safeHttpUrl } from './dom';

const TYPES: EvidenceType[] = ['public_signal', 'web_source', 'human_validation', 'simulated_interview'];

export const evidenceTypeLabel = (type: string) => t(`ev.type.short.${type}` as I18nKey);

function metricText(e: Evidence): string {
  return e.metric === null || e.metric === undefined ? '' : `${e.metric_name ? `${e.metric_name} ` : ''}${e.metric}`;
}

function evidenceItem(e: Evidence): HTMLElement {
  const hypothesis = e.type === 'simulated_interview';
  const url = safeHttpUrl(e.url);
  const title = h('span', { class: 'ev-title' });
  if (url) {
    const a = h('a', { class: 'web-link', target: '_blank', rel: 'noopener noreferrer nofollow' });
    a.href = url.href;
    a.textContent = e.title || url.hostname;
    title.append(a);
  } else title.textContent = e.title || e.code;
  const meta = [e.source, metricText(e), e.role ?? '', e.verdict ?? ''].filter(Boolean).join(' · ');
  return h(
    'div',
    { class: `ev-item${hypothesis ? ' ev-hyp' : ''}`, 'data-ev': e.code },
    h(
      'div',
      { class: 'ev-head' },
      title,
      hypothesis ? h('span', { class: 'ev-badge hyp' }, e.label || t('ev.hypothesis')) : null,
      h('span', { class: `ev-badge w${e.weight > 0 ? '' : ' zero'}` }, t('ev.weight', { w: e.weight })),
    ),
    h('div', { class: 'muted ev-meta' }, meta, ` · ${t('ev.by', { name: e.collected_by })} · ${t('hud.day', { n: e.collected_at.day })} ${fmtClock(e.collected_at.minute)}`),
    e.excerpt ? h('div', { class: 'ev-excerpt' }, e.excerpt.length > 220 ? `${e.excerpt.slice(0, 217)}…` : e.excerpt) : null,
  );
}

function bar(label: string, have: number, need: number, ok: boolean): HTMLElement {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;
  const fill = h('div', { class: 'ev-fill' });
  fill.style.width = `${pct}%`;
  return h('div', { class: `ev-bar${ok || have >= need ? ' ok' : ''}` }, h('div', { class: 'ev-bar-label' }, `${label} ${have}/${need}`), h('div', { class: 'ev-track' }, fill));
}

/** "Requisiti": progress toward the server-computed gate (numbers come from the server). */
function gateBlock(idea: Idea): HTMLElement | null {
  const g = idea.gate;
  if (!g) return null;
  return h(
    'div',
    { class: `ev-gate${g.pass ? ' pass' : ''}` },
    h('div', { class: 'ev-gate-head' }, `${t('ev.gate')} · ${g.pass ? t('ev.gate.pass') : t('ev.gate.open')}`),
    bar(t('ev.gate.real'), g.real, g.need.minReal, g.pass),
    bar(t('ev.gate.sources'), g.sources, g.need.minSources, g.pass),
    g.need.minHuman > 0 ? bar(t('ev.gate.human'), g.human, g.need.minHuman, g.pass) : null,
  );
}

/** Drawer section: requirements bar plus evidence grouped by type. Untrusted text goes through textContent only. */
export function evidenceSection(idea: Idea, flashCode?: string | null): HTMLElement {
  const list = idea.evidence ?? [];
  const groups = TYPES.map((type) => ({ type, items: list.filter((e) => e.type === type) })).filter((g) => g.items.length);
  const known = new Set<string>(TYPES);
  const other = list.filter((e) => !known.has(e.type));
  if (other.length) groups.push({ type: 'web_source', items: other });
  const sec = h(
    'div',
    { class: 'ev-section' },
    h('div', { class: 'section-title' }, `${t('ev.title')} (${list.length})`),
    gateBlock(idea),
    list.length ? groups.map((g) => h('div', { class: 'ev-group' }, h('div', { class: 'ev-group-title' }, `${t(`ev.type.${g.type}` as I18nKey)} (${g.items.length})`), g.items.map(evidenceItem))) : h('div', { class: 'muted' }, t('ev.none')),
  );
  if (flashCode) sec.querySelector(`[data-ev="${CSS.escape(flashCode)}"]`)?.classList.add('ev-new');
  return sec;
}

/** Small count + gate indicator for an idea card; null when the server sent no evidence data. */
export function evidenceBadge(idea: Idea): HTMLElement | null {
  if (!idea.evidence && !idea.gate) return null;
  const n = idea.evidence?.length ?? 0;
  const state = idea.gate ? (idea.gate.pass ? ' hi' : ' lo') : '';
  return h('span', { class: `idea-score ev-count${state}`, title: `${t('ev.cardTitle', { n })}${idea.gate ? ` · ${idea.gate.pass ? t('ev.gate.pass') : t('ev.gate.open')}` : ''}` }, `⚑ ${n}${idea.gate ? (idea.gate.pass ? ' ✓' : '') : ''}`);
}
