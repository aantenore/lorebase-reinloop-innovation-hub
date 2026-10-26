import { t, type I18nKey } from '../i18n';
import { store } from '../state/store';
import { bus } from './bus';
import { fmtClock, h, throttle, uiRoot } from './dom';
import { icon } from './icons';
import { inventoryChips } from './inventory';
import { panels } from './panels';

/** Toolbar entries: panel id, label key, shortcut. */
const TOOLBAR: { id: string; label: I18nKey; key: string }[] = [
  { id: 'ideas', label: 'hud.ideas', key: 'i' },
  { id: 'god', label: 'god.button', key: 'g' },
  { id: 'laws', label: 'laws.title', key: 'l' },
  { id: 'consciousness', label: 'hud.consciousness', key: 'c' },
  { id: 'economy', label: 'hud.economy', key: 'e' },
  { id: 'society', label: 'hud.society', key: 'o' },
  { id: 'groups', label: 'hud.groups', key: 'k' },
  { id: 'chronicle', label: 'hud.chronicle', key: 'j' },
  { id: 'minimap', label: 'hud.minimap', key: 'm' },
  { id: 'hints', label: 'hud.help', key: 'h' },
];

export function mountHud(onJoinClick: () => void): void {
  const root = uiRoot();

  // ---- top-left: clock + player stats
  const day = h('span', { class: 'day' });
  const tm = h('span', { class: 'tm' });
  const season = h('span', { class: 'season' });
  const clock = h('div', { class: 'px clock' }, day, tm, season);
  const hearts = h('div', { class: 'hearts' });
  const hunger = h('i');
  const inv = h('div', { class: 'inv' });
  const stats = h(
    'div',
    { class: 'px stats hidden' },
    h('div', {}, h('div', { class: 'stat-label' }, t('hud.hp')), hearts),
    h('div', {}, h('div', { class: 'stat-label' }, t('hud.hunger')), h('div', { class: 'meter' }, hunger)),
    inv,
  );
  const joinBtn = h('button', { class: 'btn primary hidden', onclick: onJoinClick }, t('join.enter'));
  // company status: quarter, idea slots left, strategic themes, freeze
  const quarter = h('span', { class: 'px co-q', title: t('hud.quarterTitle') });
  const slots = h('span', { class: 'px co-slots', title: t('hud.slotsTitle'), onclick: () => panels.toggle('ideas') });
  const freeze = h('span', { class: 'px co-freeze hidden', title: t('hud.freezeTitle') }, `❄ ${t('hud.freeze')}`);
  const themes = h('div', { class: 'co-themes', title: t('hud.themesTitle') });
  const company = h('div', { class: 'company hidden' }, h('div', { class: 'co-row' }, quarter, slots, freeze), themes);
  root.append(h('div', { class: 'hud-tl' }, h('div', { class: 'hud-col' }, clock, company), stats, joinBtn));

  // ---- top-right: status pills + toolbar
  const conn = h('span', { class: 'px pill' }, h('span', { class: 'dot' }), h('span'));
  const lore = h('span', { class: 'px pill', title: 'Lorebase' }, h('span', { class: 'dot' }), h('span'));
  const follow = h('button', { class: 'btn', title: 'F', onclick: () => bus.emit('follow', {}) });
  const toolbar = h('div', { class: 'toolbar' });
  for (const tb of TOOLBAR) {
    const b = h('button', { class: 'btn', 'data-panel': tb.id, onclick: () => panels.toggle(tb.id) }, t(tb.label), h('kbd', {}, tb.key.toUpperCase()));
    toolbar.append(b);
  }
  const tr = h('div', { class: 'hud-tr' }, conn, lore, follow, toolbar);
  root.append(tr);
  // panels sit below the (possibly wrapped) top bar
  new ResizeObserver(() => document.documentElement.style.setProperty('--hud-h', `${tr.getBoundingClientRect().bottom}px`)).observe(tr);
  panels.onChange((id, open) => toolbar.querySelector(`[data-panel="${id}"]`)?.classList.toggle('on', open));

  // ---- hints (help) panel
  const hints = h('div', { class: 'px hints' }, h('button', { class: 'btn x-btn', onclick: () => panels.set('hints', false) }, 'X'), t('join.keys'), h('br'), t('hud.hints'), h('br'), h('span', { class: 'muted' }, t('hud.panelsKeys')));
  root.append(hints);
  panels.register({ id: 'hints', key: 'h', defaultOpen: false, el: hints });
  TOOLBAR.forEach((tb) => toolbar.querySelector(`[data-panel="${tb.id}"]`)?.classList.toggle('on', panels.isOpen(tb.id)));

  // ---- toasts
  const toasts = h('div', { class: 'toasts' });
  root.append(toasts);
  bus.on('toast', ({ text, big }) => {
    const el = h('div', { class: `px toast${big ? ' big' : ''}` }, text);
    toasts.append(el);
    while (toasts.children.length > 4) toasts.firstElementChild?.remove();
    setTimeout(() => el.remove(), big ? 5000 : 3500);
  });

  // ---- render
  const renderClock = () => {
    day.textContent = t('hud.day', { n: store.time.day });
    tm.textContent = fmtClock(store.time.minute);
    const q = store.time.quarter ?? store.company?.quarter;
    season.textContent = q ? t(`quarter.${q}` as I18nKey) : t(`season.${store.time.season}` as I18nKey);
    season.className = q ? `season quarter-${q}${store.time.freeze ? ' freeze' : ''}` : `season season-${store.time.season}`;
  };
  const renderStats = throttle(() => {
    const you = store.you();
    stats.classList.toggle('hidden', !you);
    joinBtn.classList.toggle('hidden', !!you || !store.hasHello);
    if (!you) return;
    const n = 5;
    const per = you.maxHp / n;
    hearts.replaceChildren(
      ...Array.from({ length: n }, (_, i) => {
        const v = you.hp - i * per;
        return icon(v >= per * 0.75 ? 'heartFull' : v >= per * 0.25 ? 'heartHalf' : 'heartEmpty', 'heart');
      }),
    );
    hunger.style.width = `${Math.min(100, you.hunger)}%`;
    hunger.style.background = you.hunger > 70 ? 'var(--red)' : you.hunger > 40 ? 'var(--gold-d)' : 'var(--green)';
    const sig = JSON.stringify([you.inventory, you.tools]);
    if (inv.dataset.sig !== sig) {
      inv.dataset.sig = sig;
      inv.replaceChildren(...inventoryChips(you, 6));
    }
  }, 200);
  const renderCompany = () => {
    const c = store.company;
    company.classList.toggle('hidden', !c);
    if (!c) return;
    quarter.textContent = `${c.name ? `${c.name} · ` : ''}${c.quarter}`;
    slots.textContent = t('hud.slots', { n: c.slotsLeft });
    slots.classList.toggle('empty', c.slotsLeft <= 0);
    freeze.classList.toggle('hidden', !c.freeze);
    themes.replaceChildren(...c.themes.map((th) => h('span', { class: 'co-theme' }, th)));
  };
  const renderConn = () => {
    const s = store.status;
    conn.className = `px pill ${s === 'online' || s === 'mock' ? 'ok' : s === 'offline' ? 'bad' : ''}`;
    conn.lastElementChild!.textContent = t(`status.${s}` as I18nKey);
  };
  const renderLore = (flash: boolean) => {
    const l = store.lorebase;
    lore.className = `px pill ${l.connected ? 'ok' : 'bad'}`;
    lore.lastElementChild!.textContent = l.connected ? `⎇ ${l.branch} @ ${l.revision.slice(0, 7)}` : t('hud.lorebaseOff');
    if (flash) {
      void lore.offsetWidth;
      lore.classList.add('flash');
    }
  };
  const renderFollow = (on: boolean) => {
    follow.textContent = on ? t('hud.follow') : t('hud.free');
    follow.classList.toggle('on', on);
  };

  store.on('time', () => {
    renderClock();
    if (store.company && store.time.freeze !== undefined && store.company.freeze !== store.time.freeze) {
      store.company.freeze = store.time.freeze;
      renderCompany();
    }
  });
  store.on('company', () => {
    renderCompany();
    renderClock();
  });
  store.on('hello', () => {
    renderCompany();
    renderClock();
    renderStats();
    renderLore(false);
  });
  store.on('entity_delta', ({ e }) => e.id === store.youId && renderStats());
  store.on('status', renderConn);
  store.on('lorebase', (l) => renderLore(l.changed));
  bus.on('followChanged', ({ on }) => renderFollow(on));
  renderClock();
  renderConn();
  renderLore(false);
  renderFollow(true);
}
