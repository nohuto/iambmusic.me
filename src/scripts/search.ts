import { navigate } from 'astro:transitions/client';
import type { Playable } from '../lib/playable.ts';
import { sourceNames } from '../lib/sources.ts';
import { eventElement } from './dom.ts';

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

const dialogNow = () =>
  document.querySelector<HTMLDialogElement>('[data-search-dialog]');
const inputNow = () =>
  document.querySelector<HTMLInputElement>('[data-search-input]');
const resultsNow = () =>
  document.querySelector<HTMLUListElement>('[data-search-results]');

let invoker: HTMLElement | null = null;

function setup(): void {
  const dialog = dialogNow();
  const input = inputNow();
  const results = resultsNow();
  if (!dialog || !input || !results || dialog.dataset['searchReady'] === 'yes')
    return;
  dialog.dataset['searchReady'] = 'yes';
  bind(dialog, input, results);
}

function bind(
  dialog: HTMLDialogElement,
  input: HTMLInputElement,
  results: HTMLUListElement,
): void {
  const form = document.querySelector<HTMLFormElement>('[data-search-form]');

  const payload =
    document.querySelector('[data-playables]')?.textContent ?? '[]';
  const entries: Playable[] = JSON.parse(payload);
  const none = dialog.dataset['none'] ?? '';
  const musicPath = dialog.dataset['musicPath'] ?? '';
  let matches: Playable[] = [];
  let active = -1;

  function close(): void {
    if (dialog.open) dialog.close();
  }

  function select(entry: Playable): void {
    close();
    const filter = entry.kind === 'local' ? '' : `source=${entry.kind}&`;
    void navigate(
      `${musicPath}?${filter}focus=${encodeURIComponent(entry.id)}`,
    );
  }

  function setActive(next: number): void {
    if (matches.length === 0) return;
    active = Math.max(0, Math.min(next, matches.length - 1));
    const options = results.querySelectorAll<HTMLElement>('[role="option"]');
    for (const [index, option] of options.entries()) {
      option.setAttribute('aria-selected', String(index === active));
    }
    const option = options[active];
    if (!option) return;
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function moveActive(delta: number): void {
    setActive(
      active < 0 ? (delta > 0 ? 0 : matches.length - 1) : active + delta,
    );
  }

  function render(query: string): void {
    const needle = normalise(query);
    matches = needle
      ? entries
          .filter((entry) => normalise(entry.title).includes(needle))
          .slice(0, 30)
      : [];
    active = -1;
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', String(matches.length > 0));
    results.replaceChildren();
    if (!needle) return;

    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = none;
      empty.className = 'empty side';
      empty.setAttribute('role', 'option');
      empty.setAttribute('aria-disabled', 'true');
      results.append(empty);
      return;
    }

    for (const [index, entry] of matches.entries()) {
      const row = document.createElement('li');
      row.id = `search-result-${index}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', 'false');

      const thumbnail = entry.kind === 'local' ? null : entry.thumbnail;
      const art = document.createElement(thumbnail ? 'img' : 'span');
      art.className = 'art';
      if (thumbnail && art instanceof HTMLImageElement) {
        art.src = thumbnail;
        art.alt = '';
      }

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = entry.title;

      const side = document.createElement('span');
      side.className = 'side';
      side.textContent =
        clock(entry.durationSeconds) ||
        (entry.kind === 'local' ? '♪' : sourceNames[entry.kind]);

      row.append(art, name, side);
      row.addEventListener('click', () => select(entry));
      row.addEventListener('pointermove', () => setActive(index));
      results.append(row);
    }
  }

  form?.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (matches.length === 0) return;
      event.preventDefault();
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      const match = matches[active];
      if (!match) return;
      event.preventDefault();
      select(match);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  dialog.addEventListener('close', () => {
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'false');
    invoker?.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
}

function visibleTrigger(): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>('[data-search-open]')].find(
      (trigger) => trigger.getClientRects().length > 0,
    ) ?? null
  );
}

function openSearch(trigger = visibleTrigger()): void {
  setup();
  const dialog = dialogNow();
  const input = inputNow();
  const results = resultsNow();
  if (!dialog || !input || !results) return;

  invoker = trigger;
  if (!dialog.open) dialog.showModal();
  input.value = '';
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
  results.replaceChildren();
  input.focus();
}

document.addEventListener('click', (event) => {
  const target = eventElement(event);
  if (target?.closest('[data-search-close]')) {
    dialogNow()?.close();
    return;
  }

  const trigger = target?.closest<HTMLElement>('[data-search-open]');
  if (!trigger) return;
  event.preventDefault();
  openSearch(trigger);
});

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey))
    return;
  if (
    eventElement(event)?.closest('input, textarea, select, [contenteditable]')
  )
    return;
  event.preventDefault();
  openSearch();
});

setup();
document.addEventListener('astro:page-load', setup);
