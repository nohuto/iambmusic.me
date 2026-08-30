import { navigate } from 'astro:transitions/client';

interface Entry {
  kind: 'local' | 'youtube' | 'soundcloud';
  id: string;
  title: string;
  thumbnail?: string | null;
  durationSeconds?: number | null;
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clock = (seconds: number | null | undefined) => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

function dialogNow(): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>('[data-search-dialog]');
}

function setup(): void {
  const dialog = dialogNow();
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const results = document.querySelector<HTMLUListElement>('[data-search-results]');
  const form = document.querySelector<HTMLFormElement>('[data-search-form]');
  if (!dialog || !input || !results || dialog.dataset['searchReady'] === 'yes') return;
  dialog.dataset['searchReady'] = 'yes';

  const payload = document.querySelector('[data-playables]')?.textContent ?? '[]';
  const entries: Entry[] = JSON.parse(payload);
  const none = dialog.dataset['none'] ?? '';
  const musicPath = dialog.dataset['musicPath'] ?? '';

  function close(): void {
    if (dialog!.open) dialog!.close();
  }

  function select(entry: Entry): void {
    close();
    const filter = entry.kind === 'local' ? '' : `source=${entry.kind}&`;
    void navigate(`${musicPath}?${filter}focus=${encodeURIComponent(entry.id)}`);
  }

  function render(query: string): void {
    const needle = normalise(query);
    results!.replaceChildren();
    if (needle.length === 0) return;

    const matches = entries.filter((entry) => normalise(entry.title).includes(needle)).slice(0, 30);
    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = none;
      empty.className = 'side';
      empty.style.padding = '0.75rem';
      results!.append(empty);
      return;
    }

    for (const entry of matches) {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';

      const art = document.createElement(entry.thumbnail ? 'img' : 'span');
      art.className = 'art';
      if (entry.thumbnail && art instanceof HTMLImageElement) {
        art.src = entry.thumbnail;
        art.alt = '';
      }

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = entry.title;

      const side = document.createElement('span');
      side.className = 'side';
      side.textContent = clock(entry.durationSeconds) ||
        (entry.kind === 'local' ? '♪' : entry.kind === 'youtube' ? 'YouTube' : 'SoundCloud');

      button.append(art, name, side);
      button.addEventListener('click', () => select(entry));
      row.append(button);
      results!.append(row);
    }
  }

  form?.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('input', () => render(input.value));
  dialog.addEventListener('close', () => invoker?.focus());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
}

let invoker: HTMLElement | null = null;

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;

  if (target?.closest('[data-search-close]')) {
    dialogNow()?.close();
    return;
  }

  const trigger = target?.closest<HTMLElement>('[data-search-open]');
  if (!trigger) return;
  event.preventDefault();

  setup();
  const dialog = dialogNow();
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const results = document.querySelector<HTMLUListElement>('[data-search-results]');
  if (!dialog || !input || !results) return;

  invoker = trigger;
  dialog.showModal();
  input.value = '';
  results.replaceChildren();
  input.focus();
});

setup();
document.addEventListener('astro:page-load', setup);

export {};
