import { eventElement } from './dom.ts';

type Direction = 'asc' | 'desc';

function items(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('[data-media-row]')];
}

function renumber(panel: HTMLElement): void {
  let visible = 0;
  for (const item of items(panel)) {
    const cell = item.querySelector<HTMLElement>('[data-row-index]');
    if (item.hidden) {
      if (cell) cell.textContent = '';
      continue;
    }
    visible += 1;
    if (cell) cell.textContent = String(visible);
  }
}

function sort(panel: HTMLElement, column: string, direction: Direction): void {
  const lang = document.documentElement.lang || 'de';
  const collator = new Intl.Collator(lang, {
    numeric: true,
    sensitivity: 'base',
  });
  const list = items(panel)[0]?.parentElement;
  if (!list) return;

  const order = (item: HTMLElement) => Number(item.dataset['sortOrder'] ?? 0);

  const sorted = items(panel).sort((a, b) => {
    if (column === 'title') {
      const result = collator.compare(
        a.dataset['sortTitle'] ?? '',
        b.dataset['sortTitle'] ?? '',
      );
      if (result !== 0) return direction === 'asc' ? result : -result;
      return order(a) - order(b);
    }

    const left = a.dataset['sortDate'] ?? '';
    const right = b.dataset['sortDate'] ?? '';
    if (!left && !right) return order(a) - order(b);
    if (!left) return 1;
    if (!right) return -1;
    const result = Date.parse(left) - Date.parse(right);
    if (result !== 0) return direction === 'asc' ? result : -result;
    return order(a) - order(b);
  });

  list.append(...sorted);
  renumber(panel);
}

function mark(
  panel: HTMLElement,
  button: HTMLElement,
  direction: Direction,
): void {
  const head = button.closest<HTMLElement>('.media-head');
  for (const other of panel.querySelectorAll<HTMLElement>('[data-sort]')) {
    const state = other.querySelector('[data-sort-state]');
    if (other === button) {
      other.dataset['direction'] = direction;
      if (state)
        state.textContent =
          head?.dataset[direction === 'asc' ? 'sortAsc' : 'sortDesc'] ?? '';
    } else {
      delete other.dataset['direction'];
      if (state) state.textContent = '';
    }
  }
}

document.addEventListener('click', (event) => {
  const button = eventElement(event)?.closest<HTMLButtonElement>('[data-sort]');
  const panel = button?.closest<HTMLElement>('[data-sortable]');
  if (!button || !panel) return;

  const column = button.dataset['sort'];
  if (!column) return;
  const current = button.dataset['direction'];
  const direction: Direction =
    current === 'asc'
      ? 'desc'
      : current === 'desc'
        ? 'asc'
        : column === 'title'
          ? 'asc'
          : 'desc';

  mark(panel, button, direction);
  sort(panel, column, direction);
  const url = new URL(location.href);
  url.searchParams.set('sort', `${column}-${direction}`);
  history.replaceState(history.state, '', url);
  document.dispatchEvent(new CustomEvent('iamb:rows-changed'));
});

function restore(): void {
  const match = /^(title|released)-(asc|desc)$/.exec(
    new URLSearchParams(location.search).get('sort') ?? '',
  );
  if (!match) return;
  const [, column = '', direction = 'asc'] = match;
  for (const panel of document.querySelectorAll<HTMLElement>(
    '[data-sortable]',
  )) {
    const button = panel.querySelector<HTMLElement>(`[data-sort="${column}"]`);
    if (!button) continue;
    mark(panel, button, direction as Direction);
    sort(panel, column, direction as Direction);
  }
  document.dispatchEvent(new CustomEvent('iamb:rows-changed'));
}

function setup(): void {
  for (const panel of document.querySelectorAll<HTMLElement>('[data-sortable]'))
    renumber(panel);
}

document.addEventListener('iamb:rows-changed', setup);
restore();
setup();
document.addEventListener('astro:page-load', () => {
  restore();
  setup();
});
