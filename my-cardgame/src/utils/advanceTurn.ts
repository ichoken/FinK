import type { PlayerInfo } from '../gameConfig';

export function advanceToNextPlayer(
  currentIndex: number,
  players: PlayerInfo[],
): number {
  const n = players.length;
  for (let step = 1; step <= n; step += 1) {
    const next = (currentIndex + step) % n;
    if (!players[next].isEliminated) return next;
  }
  return currentIndex;
}
