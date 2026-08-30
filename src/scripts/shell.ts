export {};

const root = document.documentElement;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // a blocked storage API must not break the control
  }
}

function railToggle(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('[data-rail-toggle]');
}

function applyRail(collapsed: boolean): void {
  const button = railToggle();
  root.dataset['rail'] = collapsed ? 'collapsed' : 'expanded';
  const label = collapsed ? button?.dataset['expand'] : button?.dataset['collapse'];
  if (label) button?.setAttribute('aria-label', label);
}

type SourceGroup = 'music' | 'social';

function disclosure(group: SourceGroup): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(`[data-source-disclosure="${group}"]`);
}

function applySources(group: SourceGroup, expanded: boolean): void {
  const button = disclosure(group);
  root.dataset[`${group}Sources`] = expanded ? 'expanded' : 'collapsed';
  button?.setAttribute('aria-expanded', String(expanded));
  const label = expanded ? button?.dataset['collapse'] : button?.dataset['expand'];
  if (label) button?.setAttribute('aria-label', label);
}

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  if (target?.closest('[data-rail-toggle]')) {
    const collapsed = root.dataset['rail'] !== 'collapsed';
    store('iambmusic-rail', collapsed ? 'collapsed' : 'expanded');
    applyRail(collapsed);
    return;
  }
  const sourceToggle = target?.closest<HTMLButtonElement>('[data-source-disclosure]');
  const group = sourceToggle?.dataset['sourceDisclosure'] as SourceGroup | undefined;
  if (group) {
    const expanded = root.dataset[`${group}Sources`] === 'collapsed';
    store(`iambmusic-${group}-sources`, expanded ? 'expanded' : 'collapsed');
    applySources(group, expanded);
  }
});

function place(menu: HTMLElement, trigger: HTMLElement): void {
  const anchor = trigger.getBoundingClientRect();
  const viewport = window.visualViewport?.height ?? document.documentElement.clientHeight;
  const room = document.documentElement.clientWidth - menu.offsetWidth - 8;
  const below = anchor.bottom + 4;
  const fits = below + menu.offsetHeight <= viewport - 8;
  const top = fits ? below : anchor.top - 4 - menu.offsetHeight;

  menu.style.insetBlockStart = `${Math.max(8, top)}px`;
  menu.style.insetInlineStart = `${Math.max(8, Math.min(anchor.right - menu.offsetWidth, room))}px`;
}

function repositionOpenMenus(): void {
  for (const menu of document.querySelectorAll<HTMLElement>('[data-anchored-menu]')) {
    if (!menu.matches(':popover-open')) continue;
    const trigger = document.querySelector<HTMLElement>(`[popovertarget="${menu.id}"]`);
    if (trigger) place(menu, trigger);
  }
}

let lockedScrollX = 0;
let lockedScrollY = 0;

function setContextMenuScrollLock(locked: boolean): void {
  if (locked && !root.hasAttribute('data-context-menu-open')) {
    lockedScrollX = scrollX;
    lockedScrollY = scrollY;
  }
  root.toggleAttribute('data-context-menu-open', locked);
}

function syncContextMenuScrollLock(): void {
  setContextMenuScrollLock(document.querySelector('.row-menu:popover-open') !== null);
}

function blockContextMenuScroll(event: Event): void {
  if (root.hasAttribute('data-context-menu-open')) event.preventDefault();
}

function handleScroll(): void {
  if (!root.hasAttribute('data-context-menu-open')) {
    repositionOpenMenus();
    return;
  }
  if (scrollX !== lockedScrollX || scrollY !== lockedScrollY) {
    scrollTo(lockedScrollX, lockedScrollY);
  }
}

addEventListener('resize', repositionOpenMenus);
addEventListener('scroll', handleScroll, { passive: true });
addEventListener('wheel', blockContextMenuScroll, { passive: false });
addEventListener('touchmove', blockContextMenuScroll, { passive: false });

document.addEventListener('keydown', (event) => {
  if (!root.hasAttribute('data-context-menu-open')) return;
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
  if (keys.includes(event.key) || (event.key === ' ' && !(event.target as Element).closest('button, a'))) {
    event.preventDefault();
  }
});

function anchorMenus(): void {
  for (const menu of document.querySelectorAll<HTMLElement>('[data-anchored-menu]')) {
    if (menu.dataset['anchored'] === 'ready') continue;
    menu.dataset['anchored'] = 'ready';

    menu.addEventListener('beforetoggle', (event) => {
      if ((event as ToggleEvent).newState !== 'open') return;
      if (menu.classList.contains('row-menu')) setContextMenuScrollLock(true);
      menu.style.insetBlockStart = '0px';
      menu.style.insetInlineStart = '0px';
      menu.style.visibility = 'hidden';
    });

    menu.addEventListener('toggle', (event) => {
      if (menu.classList.contains('row-menu')) queueMicrotask(syncContextMenuScrollLock);
      if ((event as ToggleEvent).newState !== 'open') return;
      repositionOpenMenus();
      menu.style.visibility = '';
    });
  }
}

let headerWatch: IntersectionObserver | null = null;

function watchHeader(): void {
  headerWatch?.disconnect();
  headerWatch = null;
  const sentinel = document.querySelector<HTMLElement>('[data-header-sentinel]');
  const header = document.querySelector<HTMLElement>('[data-app-header]');
  if (!sentinel || !header) return;
  headerWatch = new IntersectionObserver(([entry]) => {
    header.toggleAttribute('data-stuck', entry?.isIntersecting === false);
  });
  headerWatch.observe(sentinel);
}

function setup(): void {
  restoreRoot();
  for (const group of ['music', 'social'] as const) {
    const active = [...document.querySelectorAll<HTMLElement>(`#${group}-sources [data-source-link]`)].some(
      (link) => link.dataset['sourceLink'] && link.hasAttribute('aria-current'),
    );
    applySources(group, active || root.dataset[`${group}Sources`] !== 'collapsed');
  }
  anchorMenus();
  syncContextMenuScrollLock();
  watchHeader();
}

function restoreRoot(): void {
  applyRail(read('iambmusic-rail') === 'collapsed');
  for (const group of ['music', 'social'] as const) {
    root.dataset[`${group}Sources`] =
      read(`iambmusic-${group}-sources`) === 'collapsed' ? 'collapsed' : 'expanded';
  }
}

setup();
document.addEventListener('astro:after-swap', restoreRoot);
document.addEventListener('astro:page-load', setup);
