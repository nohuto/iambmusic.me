import { eventElement } from './dom.ts';

interface Facts {
  count: number;
  date: string | null;
}

function apply(requested: string): void {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-media-row]')];
  const source = rows.some((row) => row.dataset['source'] === requested)
    ? requested
    : '';
  const empty = document.querySelector<HTMLElement>('[data-media-empty]');
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('[data-source-link]'),
  ];
  const surface = document.querySelector<HTMLElement>('[data-media-surface]');
  const owner = surface?.dataset['mediaSurface'] ?? '';
  const sourceRoot = document.querySelector<HTMLAnchorElement>(
    `[data-source-root="${owner}"]`,
  );
  const factsEl = document.querySelector<HTMLElement>('[data-banner-facts]');
  const countEl = document.querySelector<HTMLElement>('[data-facts-count]');
  const dotEl = document.querySelector<HTMLElement>('[data-facts-dot]');
  const updatedEl = document.querySelector<HTMLElement>('[data-facts-updated]');
  const sets: Record<string, Facts> = JSON.parse(
    factsEl?.dataset['sets'] ?? '{}',
  );

  let visible = 0;
  for (const row of rows) {
    const match = source === '' || row.dataset['source'] === source;
    row.hidden = !match;
    if (match) visible += 1;
  }
  empty?.toggleAttribute('hidden', visible > 0);

  const known = Object.hasOwn(sets, source) ? sets[source] : undefined;
  const facts = known ?? { count: visible, date: null };
  if (countEl)
    countEl.textContent = `${facts.count} ${countEl.dataset['label'] ?? ''}`;
  if (updatedEl) {
    const label = updatedEl.dataset['label'] ?? '';
    updatedEl.textContent = facts.date ? `${label} ${facts.date}` : '';
    updatedEl.toggleAttribute('hidden', !facts.date);
  }
  dotEl?.toggleAttribute('hidden', !facts.date);

  sourceRoot?.setAttribute('aria-current', 'page');

  for (const link of links) {
    const isActive = (link.dataset['sourceLink'] ?? '') === source;
    if (isActive) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }

  document.dispatchEvent(new CustomEvent('iamb:rows-changed'));
}

function focusRow(id: string): void {
  const target = [
    ...document.querySelectorAll<HTMLElement>('[data-media-row]'),
  ].find((row) => row.dataset['mediaId'] === id);
  const action = target?.querySelector<HTMLElement>('a, button');
  if (!target || !action) return;
  const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({
    block: 'center',
    behavior: instant ? 'auto' : 'smooth',
  });
  action.focus({ preventScroll: true });
  target.setAttribute('data-media-focus', '');
  setTimeout(() => target.removeAttribute('data-media-focus'), 3500);
}

function setup(): void {
  if (!document.querySelector('[data-media-surface]')) return;
  const params = new URLSearchParams(location.search);
  apply(params.get('source') ?? '');
  const focus = params.get('focus');
  if (focus) focusRow(focus);
}

document.addEventListener(
  'click',
  (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    const link =
      eventElement(event)?.closest<HTMLAnchorElement>('[data-source-link]');
    if (!link || new URL(link.href).pathname !== location.pathname) return;
    event.preventDefault();
    const source = link.dataset['sourceLink'] ?? '';
    history.replaceState(history.state, '', link.href);
    apply(source);
  },
  { capture: true },
);

setup();
document.addEventListener('astro:page-load', setup);
