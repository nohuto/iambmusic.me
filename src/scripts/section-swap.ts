import { swapFunctions } from 'astro:transitions/client';

export {};

function isInternalSection(from: URL, to: URL): boolean {
  const own = (path: string) => path.split('/').filter(Boolean);
  const a = own(from.pathname);
  const b = own(to.pathname);
  return a.length >= 2 && b.length >= 2 && a[0] === b[0] && a[1] === b[1];
}

document.addEventListener('astro:before-swap', (event) => {
  const swap = event as unknown as {
    from: URL;
    to: URL;
    newDocument: Document;
    swap: () => void;
  };
  if (!isInternalSection(swap.from, swap.to)) return;

  swap.swap = () => {
    swapFunctions.deselectScripts(swap.newDocument);
    swapFunctions.swapRootAttributes(swap.newDocument);
    swapFunctions.swapHeadElements(swap.newDocument);

    const playback = document.querySelector('.playback');
    swap.newDocument.querySelector('.playback')?.remove();

    const focus = swapFunctions.saveFocus();
    for (const node of [...document.body.childNodes]) {
      if (node !== playback) node.remove();
    }
    document.body.prepend(...swap.newDocument.body.childNodes);
    focus();
  };
});
