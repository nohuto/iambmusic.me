import { eventElement } from './dom.ts';

type Theme = 'light' | 'dark';

const system = matchMedia('(prefers-color-scheme: dark)');
const systemTheme = (): Theme => (system.matches ? 'dark' : 'light');
const activeTheme = (): Theme => {
  const theme = document.documentElement.dataset.theme;
  return theme === 'dark' || theme === 'light' ? theme : systemTheme();
};

function restoreOverride(): void {
  document.documentElement.classList.add('has-js');
  let theme: string | null = null;
  try {
    theme = localStorage.getItem('theme_override');
  } catch {}
  if (theme === 'dark' || theme === 'light')
    document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  syncControls();
}

function syncControls(): void {
  const theme = activeTheme();
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-theme-toggle]',
  )) {
    const next =
      theme === 'dark'
        ? button.dataset['labelLight']
        : button.dataset['labelDark'];
    if (next) button.setAttribute('aria-label', next);
    button.setAttribute('aria-checked', String(theme === 'dark'));
  }
}

document.addEventListener('click', (event) => {
  if (!eventElement(event)?.closest('[data-theme-toggle]')) return;
  const next = activeTheme() === 'dark' ? 'light' : 'dark';
  const override = next === systemTheme() ? null : next;
  if (override) document.documentElement.dataset.theme = override;
  else delete document.documentElement.dataset.theme;
  try {
    if (override) localStorage.setItem('theme_override', override);
    else localStorage.removeItem('theme_override');
  } catch {}
  syncControls();
});

system.addEventListener('change', syncControls);
document.addEventListener('astro:before-swap', (event) => {
  const incoming = event.newDocument;
  const current = document.documentElement.dataset.theme;
  if (current === 'dark' || current === 'light')
    incoming.documentElement.dataset.theme = current;
  else delete incoming.documentElement.dataset.theme;
});
document.addEventListener('astro:after-swap', restoreOverride);
document.addEventListener('astro:page-load', syncControls);
restoreOverride();
