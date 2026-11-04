import type { RepeatMode } from './player-queue.ts';

interface PlayerSession {
  readonly itemId: string | null;
  readonly time: number;
  readonly shuffled: boolean;
  readonly repeatMode: RepeatMode;
  readonly sequence: string[] | null;
  readonly order: string[] | null;
  readonly manualQueue: string[];
}

type ResolveId = (value: unknown) => string | null;

function readIds(value: unknown, resolve: ResolveId): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.map(resolve);
  if (ids.some((id) => id === null)) return null;
  const valid = ids as string[];
  if (new Set(valid).size !== valid.length) return null;
  return valid;
}

export function readSession(
  key: string,
  resolve: ResolveId,
): PlayerSession | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Record<
      string,
      unknown
    > | null;
    if (!saved) return null;
    const repeat = saved['repeatMode'];
    const time = Number(saved['time']);
    return {
      itemId: resolve(saved['itemId']),
      time: Number.isFinite(time) && time > 0 ? time : 0,
      shuffled: saved['shuffled'] === true,
      repeatMode: repeat === 'all' || repeat === 'one' ? repeat : 'off',
      sequence: readIds(saved['sequence'], resolve),
      order: readIds(saved['order'], resolve),
      manualQueue: Array.isArray(saved['manualQueue'])
        ? saved['manualQueue']
            .map(resolve)
            .filter((id): id is string => id !== null)
        : [],
    };
  } catch {
    return null;
  }
}

export function writeSession(
  key: string,
  session: Omit<PlayerSession, 'sequence'> & {
    readonly sequence: string[] | undefined;
  },
): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch {}
}
