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

function disclosure(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('[data-source-disclosure]');
}

function applySources(expanded: boolean): void {
  const button = disclosure();
  root.dataset['sources'] = expanded ? 'expanded' : 'collapsed';
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
  if (target?.closest('[data-source-disclosure]')) {
    const expanded = root.dataset['sources'] === 'collapsed';
    store('iambmusic-sources', expanded ? 'expanded' : 'collapsed');
    applySources(expanded);
  }
});

function place(menu: HTMLElement, trigger: HTMLElement): void {
  const anchor = trigger.getBoundingClientRect();
  const room = document.documentElement.clientWidth - menu.offsetWidth - 8;
  menu.style.insetBlockStart = `${anchor.bottom + 4}px`;
  menu.style.insetInlineStart = `${Math.max(8, Math.min(anchor.right - menu.offsetWidth, room))}px`;
}

function anchorMenus(): void {
  for (const menu of document.querySelectorAll<HTMLElement>('[data-anchored-menu]')) {
    if (menu.dataset['anchored'] === 'ready') continue;
    menu.dataset['anchored'] = 'ready';

    const trigger = document.querySelector<HTMLElement>(`[popovertarget="${menu.id}"]`);
    if (!trigger) continue;

    const reposition = (): void => {
      if (menu.matches(':popover-open')) place(menu, trigger);
    };

    menu.addEventListener('beforetoggle', (event) => {
      if ((event as ToggleEvent).newState !== 'open') return;
      menu.style.insetBlockStart = '0px';
      menu.style.insetInlineStart = '0px';
      menu.style.visibility = 'hidden';
    });

    menu.addEventListener('toggle', (event) => {
      if ((event as ToggleEvent).newState !== 'open') return;
      place(menu, trigger);
      menu.style.visibility = '';
    });

    addEventListener('resize', reposition);
    addEventListener('scroll', reposition, { passive: true });
  }
}

function setup(): void {
  restoreRoot();
  const activeSource = document.querySelector('[data-source-link][aria-current]');
  applySources(Boolean(activeSource) || root.dataset['sources'] !== 'collapsed');
  anchorMenus();
}

function restoreRoot(): void {
  applyRail(read('iambmusic-rail') === 'collapsed');
  root.dataset['sources'] = read('iambmusic-sources') === 'collapsed' ? 'collapsed' : 'expanded';
}

setup();
document.addEventListener('astro:after-swap', restoreRoot);
document.addEventListener('astro:page-load', setup);
