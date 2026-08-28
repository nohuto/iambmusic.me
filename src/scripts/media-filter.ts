export {};

interface Facts {
  count: number;
  date: string | null;
}

function apply(source: string): void {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-media-row]')];
  const empty = document.querySelector<HTMLElement>('[data-media-empty]');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-source-link]')];
  const surface = document.querySelector<HTMLElement>('[data-media-surface]');
  const owner = surface?.dataset['mediaSurface'] ?? '';
  const socialRoot =
    owner === 'social' ? document.querySelector<HTMLAnchorElement>('[data-social-root]') : null;
  const factsEl = document.querySelector<HTMLElement>('[data-banner-facts]');
  const countEl = document.querySelector<HTMLElement>('[data-facts-count]');
  const dotEl = document.querySelector<HTMLElement>('[data-facts-dot]');
  const updatedEl = document.querySelector<HTMLElement>('[data-facts-updated]');
  const sets: Record<string, Facts> = JSON.parse(factsEl?.dataset['sets'] ?? '{}');

  let visible = 0;
  for (const row of rows) {
    const match = source === '' || row.dataset['source'] === source;
    row.hidden = !match;
    if (match) visible += 1;
  }
  empty?.toggleAttribute('hidden', visible > 0);

  const facts = sets[source] ?? { count: visible, date: null };
  if (countEl) countEl.textContent = `${facts.count} ${countEl.dataset['label'] ?? ''}`;
  if (updatedEl) {
    const label = updatedEl.dataset['label'] ?? '';
    updatedEl.textContent = facts.date ? `${label} ${facts.date}` : '';
    updatedEl.toggleAttribute('hidden', !facts.date);
  }
  dotEl?.toggleAttribute('hidden', !facts.date);

  if (socialRoot) {
    if (source === '') socialRoot.setAttribute('aria-current', 'page');
    else socialRoot.removeAttribute('aria-current');
  }
  for (const link of links) {
    const isActive = (link.dataset['sourceLink'] ?? '') === source;
    if (isActive) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function focusRow(id: string): void {
  const target = [...document.querySelectorAll<HTMLElement>('[data-media-row]')].find(
    (row) => row.dataset['mediaId'] === id,
  );
  const action = target?.querySelector<HTMLElement>('a, button');
  if (!target || !action) return;
  const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ block: 'center', behavior: instant ? 'auto' : 'smooth' });
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

document.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('[data-source-link]');
  if (!link) return;
  event.preventDefault();
  const source = link.dataset['sourceLink'] ?? '';
  history.replaceState(null, '', source ? `?source=${source}` : location.pathname);
  apply(source);
});

setup();
document.addEventListener('astro:page-load', setup);
