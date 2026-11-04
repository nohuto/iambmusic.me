export type RepeatMode = 'off' | 'all' | 'one';

export function playOrder(
  sequence: readonly string[],
  currentId: string,
  shuffled: boolean,
): string[] {
  if (!shuffled) return [...sequence];
  const rest = sequence.filter((id) => id !== currentId);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const here = rest[i];
    const there = rest[j];
    if (here === undefined || there === undefined) continue;
    rest[i] = there;
    rest[j] = here;
  }
  return sequence.includes(currentId) ? [currentId, ...rest] : rest;
}

export function neighbourIn(
  order: readonly string[],
  currentId: string,
  delta: number,
): string | undefined {
  const size = order.length;
  if (size === 0) return undefined;
  const at = order.indexOf(currentId);
  if (at < 0) return delta > 0 ? order[0] : order[size - 1];
  if (size < 2) return undefined;
  return order[(at + delta + size) % size];
}

export function isLastIn(order: readonly string[], id: string): boolean {
  return order.indexOf(id) === order.length - 1;
}
