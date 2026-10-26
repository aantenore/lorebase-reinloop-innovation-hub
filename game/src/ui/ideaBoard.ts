import { config } from '../config';
import { t, type I18nKey } from '../i18n';
import { authHeaders } from '../net/http';
import { IDEA_STAGES, type CommitteeMsg, type GameTime, type Idea, type IdeaList, type IdeaScores } from '../net/protocol';
import { session } from '../net/session';
import { drawPortrait } from '../render/portrait';
import { store } from '../state/store';
import { bus } from './bus';
import { fmtClock, h, uiRoot, webLink } from './dom';
import { panels } from './panels';

const PANEL = 'ideas';
const SCORE_KEYS: (keyof IdeaScores)[] = ['impact', 'feasibility', 'novelty', 'fit', 'risk'];

const stageLabel = (s: string) => t(`ideas.stage.${s}` as I18nKey);
const when = (at: GameTime) => `${t('hud.day', { n: at.day })} ${fmtClock(at.minute)}`;
/** People in an idea (champion, authors, reviewers, history) are already NAMES: shown as they are. */
const personName = (name: string) => name;
/** Entity (or person) carrying that name, if any. */
function byName(name: string) {
  for (const e of store.entities.values()) if (e.name === name) return e;
  for (const p of store.people.values()) if (p.name === name) return p;
  return undefined;
}
/** Committee votes carry the member's entity id: shown as the entity's name (raw id as fallback). */
const memberName = (id: string) => store.personName(id);

/** Mean of the value scores (risk counts inverted). */
function overall(s: IdeaScores | null): number | null {
  if (!s) return null;
  return (s.impact + s.feasibility + s.novelty + s.fit + (6 - s.risk)) / 5;
}

/** Small pixel avatar of a person (falls back to initials when unknown). */
function avatar(ref: string | null, cls = 'idea-ava'): HTMLElement {
  const e = ref ? byName(ref) : undefined;
  if (!e) return h('span', { class: `${cls} idea-ava-none` }, ref ? personName(ref).slice(0, 2) : '?');
  const c = h('canvas', { class: cls, width: 56, height: 60, title: e.name }) as HTMLCanvasElement;
  drawPortrait(c, { name: e.name, role: e.role, kind: 'kind' in e ? e.kind : 'agent', age: e.age });
  return c;
}

/** Five-axis radar of the scores (SVG). */
function radar(s: IdeaScores | null, size = 150): Element {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'idea-radar');
  const c = size / 2;
  const R = size / 2 - 22;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / SCORE_KEYS.length;
    return [c + Math.cos(a) * R * (v / 5), c + Math.sin(a) * R * (v / 5)];
  };
  const poly = (vals: number[], cls: string) => {
    const p = document.createElementNS(ns, 'polygon');
    p.setAttribute('points', vals.map((v, i) => pt(i, v).join(',')).join(' '));
    p.setAttribute('class', cls);
    svg.append(p);
  };
  for (const ring of [1, 2, 3, 4, 5]) poly(SCORE_KEYS.map(() => ring), 'radar-grid');
  SCORE_KEYS.forEach((k, i) => {
    const [x, y] = pt(i, 6.1);
    const tx = document.createElementNS(ns, 'text');
    tx.setAttribute('x', String(x));
    tx.setAttribute('y', String(y + 3));
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('class', 'radar-label');
    tx.textContent = `${t(`score.${k}` as I18nKey)}${s ? ` ${s[k].toFixed(1)}` : ''}`;
    svg.append(tx);
  });
  if (s) poly(SCORE_KEYS.map((k) => s[k]), 'radar-value');
  return svg;
}

/** Portfolio as Markdown, built from the client state (used when the hub has no export endpoint, e.g. offline). */
function portfolioMarkdown(): string {
  const lines = [`# ${t('ideas.title')} · ${store.company?.name ?? ''} ${store.company?.quarter ?? ''}`.trim(), ''];
  for (const stage of IDEA_STAGES) {
    const list = [...store.ideas.values()].filter((i) => i.stage === stage);
    if (!list.length) continue;
    lines.push(`## ${stageLabel(stage)}`, '');
    for (const i of list) {
      const o = overall(i.scores);
      lines.push(`### ${i.code} · ${i.title}`, '');
      lines.push(`- ${t('ideas.champion')}: ${i.champion ? personName(i.champion) : t('ideas.noChampion')}`);
      if (o !== null) lines.push(`- ${t('ideas.scores')}: ${SCORE_KEYS.map((k) => `${t(`score.${k}` as I18nKey)} ${i.scores![k]}`).join(' · ')}`);
      for (const k of ['problem', 'users', 'solution', 'differentiation', 'feasibility', 'risks'] as const) if (i[k]) lines.push(`- ${t(`ideas.${k}` as I18nKey)}: ${i[k]}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function download(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportPortfolio(): Promise<void> {
  const name = `portfolio-${(store.company?.quarter ?? 'hub').toLowerCase()}.md`;
  try {
    if (session.transport?.kind !== 'ws') {
      download(name, new Blob([portfolioMarkdown()], { type: 'text/markdown' }));
    } else {
      const res = await fetch(`${config.apiBase}${config.hub.exportPath}`, { headers: { accept: 'text/markdown', ...authHeaders() } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      download(name, await res.blob());
    }
    bus.emit('toast', { text: t('ideas.exported') });
  } catch (err) {
    bus.emit('toast', { text: t('ideas.exportErr', { err: (err as Error).message }) });
  }
}

/**
 * Idea Board: kanban of the hub ideas by stage, a detail drawer per idea and the committee
 * decision banner. Cards slide between columns when an `idea` event moves them.
 */
export function mountIdeaBoard(): void {
  const count = h('span', { class: 'muted idea-count' });
  const board = h('div', { class: 'idea-board' });
  const drawer = h('div', { class: 'idea-drawer hidden' });
  const el = h(
    'div',
    { class: 'px panel ideas hidden' },
    h('button', { class: 'btn x-btn', onclick: () => panels.set(PANEL, false) }, 'X'),
    h('div', { class: 'idea-head' }, h('div', { class: 'px-title' }, t('ideas.title')), count, h('button', { class: 'btn primary', onclick: () => void exportPortfolio() }, t('ideas.export'))),
    h('div', { class: 'note' }, t('ideas.subtitle')),
    h('div', { class: 'idea-body' }, board, drawer),
  );
  uiRoot().append(el);
  panels.register({ id: PANEL, key: 'i', defaultOpen: false, el, slot: 'center', onOpen: () => (render(), void load()) });

  let selected: string | null = null;
  const flashed = new Map<string, number>();

  const load = async () => {
    try {
      const res = await session.transport?.getJson<IdeaList>('/ideas');
      const list = Array.isArray(res) ? res : res?.ideas;
      if (list) store.setIdeas(list);
    } catch {
      /* live events and hello still fill the board */
    }
  };

  const card = (i: Idea) => {
    const o = overall(i.scores);
    const flash = (flashed.get(i.code) ?? 0) > Date.now();
    return h(
      'div',
      { class: `idea-card${selected === i.code ? ' sel' : ''}${flash ? ' moved' : ''}`, 'data-code': i.code, onclick: () => ((selected = selected === i.code ? null : i.code), render()) },
      h('div', { class: 'idea-card-title' }, i.title),
      h(
        'div',
        { class: 'idea-card-who' },
        avatar(i.champion),
        h('div', {}, h('div', { class: 'idea-champ' }, i.champion ? personName(i.champion) : t('ideas.noChampion')), h('div', { class: 'muted idea-authors' }, i.authors.filter((a) => a !== i.champion).map(personName).join(', '))),
      ),
      h('div', { class: 'idea-tags' }, ...i.tags.slice(0, 3).map((tg) => h('span', { class: 'idea-tag' }, tg))),
      h(
        'div',
        { class: 'idea-badges' },
        o !== null ? h('span', { class: `idea-score ${o >= 3.8 ? 'hi' : o >= 3.2 ? 'mid' : 'lo'}`, title: t('ideas.scores') }, `★ ${o.toFixed(1)}`) : null,
        i.scores ? h('span', { class: `idea-score risk ${i.scores.risk >= 3.2 ? 'lo' : 'hi'}`, title: t('score.risk') }, `⚠ ${i.scores.risk.toFixed(1)}`) : null,
        i.reviews.length ? h('span', { class: 'idea-score', title: t('ideas.reviews') }, `✎ ${i.reviews.length}`) : null,
        h('span', { class: 'muted idea-code' }, i.code),
      ),
    );
  };

  const field = (label: I18nKey, text: string) => h('div', { class: 'idea-field' }, h('div', { class: 'section-title' }, t(label)), h('div', { class: text ? '' : 'muted' }, text || t('ideas.tbd')));

  /** Web sources as safe external links (http/https only); hidden when none. */
  const sourcesBlock = (i: Idea) => {
    const links = (i.sources ?? []).map((s) => webLink(s)).filter((a): a is HTMLAnchorElement => !!a);
    if (!links.length) return [];
    return [h('div', { class: 'idea-field' }, h('div', { class: 'section-title' }, `${t('ideas.sources')} (${links.length})`), h('ul', { class: 'idea-sources' }, ...links.map((a) => h('li', {}, a))))];
  };

  const renderDrawer = () => {
    const i = selected ? store.ideas.get(selected) : undefined;
    drawer.classList.toggle('hidden', !i);
    if (!i) return drawer.replaceChildren();
    const base = config.lorebaseUi.base;
    const branchUrl = `${base}/${config.hub.domain}/explorer?branch=${encodeURIComponent(i.branch)}`;
    const proposalUrl = i.proposalId ? `${base}/${config.hub.domain}/review/${encodeURIComponent(i.proposalId)}` : null;
    drawer.replaceChildren(
      h('button', { class: 'btn x-btn', onclick: () => ((selected = null), render()) }, 'X'),
      h('div', { class: 'idea-d-head' }, avatar(i.champion, 'portrait'), h('div', {}, h('div', { class: 'name' }, i.title), h('div', { class: 'sub' }, `${i.code} · ${stageLabel(i.stage)} · ${i.quarter}`), h('div', { class: 'sub' }, `${t('ideas.champion')}: ${i.champion ? personName(i.champion) : t('ideas.noChampion')}`), h('div', { class: 'sub muted' }, `${t('ideas.authors')}: ${i.authors.map(personName).join(', ')}`))),
      h('div', { class: 'idea-links' }, h('a', { class: 'btn', href: branchUrl, target: '_blank', rel: 'noopener' }, `⎇ ${t('ideas.branch')}`), proposalUrl ? h('a', { class: 'btn', href: proposalUrl, target: '_blank', rel: 'noopener' }, `${t('ideas.proposal')} ${i.proposalId}`) : null),
      h('div', { class: 'idea-tags' }, ...i.tags.map((tg) => h('span', { class: 'idea-tag' }, tg))),
      field('ideas.problem', i.problem),
      field('ideas.users', i.users),
      field('ideas.solution', i.solution),
      field('ideas.differentiation', i.differentiation),
      field('ideas.feasibility', i.feasibility),
      field('ideas.risks', i.risks),
      ...sourcesBlock(i),
      h('div', { class: 'section-title' }, t('ideas.scores')),
      i.scores ? radar(i.scores) : h('div', { class: 'muted' }, t('ideas.noScores')),
      h('div', { class: 'section-title' }, `${t('ideas.reviews')} (${i.reviews.length})`),
      i.reviews.length
        ? h('div', { class: 'idea-reviews' }, ...i.reviews.map((r) => h('div', { class: 'idea-review' }, h('div', { class: 'idea-rev-head' }, h('b', {}, personName(r.by)), h('span', { class: 'muted' }, ` · ${when(r.at)} · ★ ${(overall(r.scores) ?? 0).toFixed(1)}`)), h('div', {}, r.comment))))
        : h('div', { class: 'muted' }, t('ideas.noReviews')),
      h('div', { class: 'section-title' }, t('ideas.history')),
      h('ol', { class: 'idea-history' }, ...[...i.history].reverse().map((e) => h('li', {}, h('span', { class: 'muted' }, when(e.at)), ' ', h('b', {}, personName(e.by)), ` · ${e.action}`, e.note ? h('div', { class: 'idea-note' }, e.note) : null))),
    );
  };

  const render = () => {
    if (!panels.isOpen(PANEL)) return;
    // FLIP: remember where every card was, render, then slide moved cards from there
    const before = new Map<string, DOMRect>();
    board.querySelectorAll<HTMLElement>('.idea-card').forEach((c) => before.set(c.dataset.code!, c.getBoundingClientRect()));
    const ideas = [...store.ideas.values()];
    count.textContent = t('ideas.count', { n: ideas.length });
    const scrolls = new Map<string, number>();
    board.querySelectorAll<HTMLElement>('.idea-col-list').forEach((c) => scrolls.set(c.dataset.stage!, c.scrollTop));
    board.replaceChildren(
      ...IDEA_STAGES.map((stage) => {
        const list = ideas.filter((i) => i.stage === stage).sort((a, b) => (overall(b.scores) ?? 0) - (overall(a.scores) ?? 0));
        const col = h('div', { class: 'idea-col-list', 'data-stage': stage }, ...(list.length ? list.map(card) : [h('div', { class: 'muted idea-empty' }, '—')]));
        return h('div', { class: `idea-col stage-${stage}` }, h('div', { class: 'idea-col-head' }, stageLabel(stage), h('span', { class: 'muted' }, ` ${list.length}`)), col);
      }),
    );
    board.querySelectorAll<HTMLElement>('.idea-col-list').forEach((c) => (c.scrollTop = scrolls.get(c.dataset.stage!) ?? 0));
    if (!ideas.length) board.append(h('div', { class: 'note' }, store.hasHello ? t('ideas.empty') : t('ideas.unavailable')));
    board.querySelectorAll<HTMLElement>('.idea-card').forEach((c) => {
      const prev = before.get(c.dataset.code!);
      if (!prev) return;
      const now = c.getBoundingClientRect();
      const dx = prev.left - now.left;
      const dy = prev.top - now.top;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      c.animate([{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 3 }, { transform: 'none', zIndex: 3 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    renderDrawer();
  };

  store.on('hello', () => render());
  store.on('ideas', () => render());
  store.on('society', () => render());
  store.on('idea', ({ idea, action, prevStage }) => {
    if (prevStage !== idea.stage || action === 'created') {
      flashed.set(idea.code, Date.now() + config.hub.cardFlashMs);
      setTimeout(() => render(), config.hub.cardFlashMs + 50);
    }
    if (action === 'created') bus.emit('toast', { text: `💡 ${t('idea.new', { title: idea.title })}` });
    else if (prevStage && prevStage !== idea.stage && idea.stage !== 'approved' && idea.stage !== 'killed') bus.emit('toast', { text: t('idea.moved', { title: idea.title, to: stageLabel(idea.stage) }) });
    render();
  });
  bus.on('openIdea', ({ code }) => {
    selected = code;
    panels.set(PANEL, true);
    render();
  });

  mountCommitteeBanner();
}

/** Banner for a committee decision; the votes are shown in Board mode. Click opens the idea. */
function mountCommitteeBanner(): void {
  const host = h('div', { class: 'committees' });
  uiRoot().append(host);
  store.on('committee', (c: CommitteeMsg) => {
    const idea = store.ideas.get(c.ideaCode);
    const board = panels.isOpen('god');
    const banner = h(
      'div',
      { class: `px committee committee-${c.decision}`, onclick: () => bus.emit('openIdea', { code: c.ideaCode }) },
      h('div', { class: 'committee-kicker' }, `${t('committee.title')} · ${t(`committee.${c.decision}` as I18nKey)}`),
      h('div', { class: 'committee-title' }, idea?.title ?? c.ideaCode),
      h('div', { class: 'committee-sum' }, c.summary),
      board && c.votes?.length
        ? h('div', { class: 'committee-votes' }, ...c.votes.map((v) => h('div', { class: `committee-vote vote-${v.vote}` }, h('b', {}, memberName(v.member)), ` ${t(`committee.vote.${v.vote}` as I18nKey)} · `, h('span', { class: 'muted' }, v.reason))))
        : null,
    );
    host.append(banner);
    while (host.children.length > 2) host.firstElementChild?.remove();
    setTimeout(() => banner.classList.add('out'), config.hub.committeeBannerMs);
    setTimeout(() => banner.remove(), config.hub.committeeBannerMs + 600);
  });
}

