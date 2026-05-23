import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';

type Args = {
  activePlayerIndex: number;
  gameState: GameState;
  players: PlayerInfo[];
  onDraw: () => void;
  onPlayCard: (index: number) => Promise<void>;
  sleep: (ms: number) => Promise<void>;
};

function listPlayableIndexes(hand: { no: number }[]): number[] {
  return hand
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.no !== 12 && c.no !== 6 && c.no !== 7)
    .map(({ i }) => i);
}

export async function runCpuTurn({
  activePlayerIndex,
  gameState,
  players,
  onDraw,
  onPlayCard,
  sleep,
}: Args) {
  if (gameState.gameOver) return;
  if (players[activePlayerIndex].isEliminated) return;

  const hand = gameState.hands[activePlayerIndex];
  const deckEmpty = gameState.deck.length === 0;
  const handFull = hand.length >= 4;
  const playable = listPlayableIndexes(hand);

  await sleep(900);

  if (handFull && playable.length > 0) {
    const idx = playable[Math.floor(Math.random() * playable.length)];
    await onPlayCard(idx);
    return;
  }

  if (deckEmpty) {
    if (playable.length > 0) {
      const idx = playable[Math.floor(Math.random() * playable.length)];
      await onPlayCard(idx);
    }
    return;
  }

  if (Math.random() < 0.5 || playable.length === 0) {
    onDraw();
    return;
  }

  const idx = playable[Math.floor(Math.random() * playable.length)];
  await onPlayCard(idx);
}
