export {};

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
  const collator = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' });
  const list = items(panel)[0]?.parentElement;
  if (!list) return;

  const order = (item: HTMLElement) => Number(item.dataset['sortOrder'] ?? 0);

  const sorted = items(panel).sort((a, b) => {
    if (column === 'title') {
      const result = collator.compare(a.dataset['sortTitle'] ?? '', b.dataset['sortTitle'] ?? '');
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

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-sort]');
  const panel = button?.closest<HTMLElement>('[data-sortable]');
  if (!button || !panel) return;

  const column = button.dataset['sort']!;
  const fallback: Direction = column === 'title' ? 'asc' : 'desc';
  const current = button.dataset['direction'] as Direction | undefined;
  const direction: Direction = current ? (current === 'asc' ? 'desc' : 'asc') : fallback;

  for (const other of panel.querySelectorAll<HTMLElement>('[data-sort]')) {
    if (other !== button) delete other.dataset['direction'];
  }
  button.dataset['direction'] = direction;
  sort(panel, column, direction);
  document.dispatchEvent(new CustomEvent('iamb:rows-changed'));
});

function setup(): void {
  for (const panel of document.querySelectorAll<HTMLElement>('[data-sortable]')) renumber(panel);
}

document.addEventListener('iamb:rows-changed', setup);
setup();
document.addEventListener('astro:page-load', setup);
