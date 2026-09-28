import { swapFunctions } from 'astro:transitions/client';

function isInternalSection(from: URL, to: URL): boolean {
  const own = (path: string) => path.split('/').filter(Boolean);
  const a = own(from.pathname);
  const b = own(to.pathname);
  return a.length >= 2 && b.length >= 2 && a[0] === b[0] && a[1] === b[1];
}

document.addEventListener('astro:before-swap', (event) => {
  if (!isInternalSection(event.from, event.to)) return;
  const incoming = event.newDocument;
  const playback = document.body.querySelector(':scope > .playback');
  const placeholder = incoming.body.querySelector(':scope > .playback');
  if (!playback || !placeholder) return;

  event.swap = () => {
    swapFunctions.deselectScripts(incoming);
    swapFunctions.swapRootAttributes(incoming);
    swapFunctions.swapHeadElements(incoming);

    const nodes = [...incoming.body.childNodes];
    const split = nodes.indexOf(placeholder);
    const focus = swapFunctions.saveFocus();
    for (const node of [...document.body.childNodes]) {
      if (node !== playback) node.remove();
    }
    playback.before(...nodes.slice(0, split));
    playback.after(...nodes.slice(split + 1));
    focus();
  };
});
