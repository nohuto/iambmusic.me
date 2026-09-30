import { eventElement } from './dom.ts';

const EMAIL_KEY = 23;
const EMAIL_BYTES = [
  126, 118, 122, 117, 57, 100, 110, 121, 99, 127, 122, 98, 100, 126, 116, 87,
  112, 122, 118, 126, 123, 57, 116, 120, 122,
];

function emailAddress(): string {
  return EMAIL_BYTES.map((byte) => String.fromCharCode(byte ^ EMAIL_KEY)).join(
    '',
  );
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string | undefined): void {
  const toast = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!toast || !message) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function fillEmail(): void {
  for (const text of document.querySelectorAll<HTMLElement>(
    '[data-email-text]',
  )) {
    text.textContent = emailAddress();
  }
}

document.addEventListener('click', async (event) => {
  const source = eventElement(event)?.closest<HTMLElement>('[data-email]');
  if (!source) return;
  event.preventDefault();
  try {
    await navigator.clipboard.writeText(emailAddress());
    showToast(source.dataset['toast']);
  } catch {
    showToast(source.dataset['failed']);
  }
});

fillEmail();
document.addEventListener('astro:page-load', fillEmail);
