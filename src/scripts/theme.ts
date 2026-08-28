type Theme = 'light' | 'dark';

const STORAGE_KEY = 'iambmusic-theme';
const root = document.documentElement;

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function resolve(): Theme {
  return saved() ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function syncControls(theme: Theme): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    const next = theme === 'dark' ? button.dataset['labelLight'] : button.dataset['labelDark'];
    if (next) button.setAttribute('aria-label', next);
    button.setAttribute('aria-checked', String(theme === 'dark'));
  }
}

function apply(theme: Theme): void {
  root.classList.add('has-js');
  root.dataset['theme'] = theme;
  syncControls(theme);
}

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest('[data-theme-toggle]');
  if (!button) return;
  const next: Theme = root.dataset['theme'] === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // a blocked storage API must not break the control
  }
  apply(next);
});

apply(resolve());
document.addEventListener('astro:after-swap', () => apply(resolve()));
document.addEventListener('astro:page-load', () => syncControls(resolve()));

export {};
