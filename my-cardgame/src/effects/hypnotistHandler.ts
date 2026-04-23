import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { trySisterDefense } from '../utils/sisterDefense';
import { discardUsedCard } from '../utils/discardUsedCard';
import { findAttackTargets } from '../utils/checkTargets';

export function listHypnotistTargets(
  activePlayerIndex: number,
  gameState: GameState,
  players: PlayerInfo[]
): number[] {
  return findAttackTargets(activePlayerIndex, gameState, players);
}

type ResolveHypnotistOnTargetArgs = {
  sourcePlayerIndex: number;
  targetIndex: number;
  players: PlayerInfo[];
  gameState: GameState;
  setGameState: (fn: (prev: GameState) => GameState) => void;
  onForcePlayFromHand: (targetPlayerIndex: number, cardIndex: number) => void;
};

export function resolveHypnotistOnTarget({
  sourcePlayerIndex,
  targetIndex,
  players,
  gameState,
  setGameState,
  onForcePlayFromHand,
}: ResolveHypnotistOnTargetArgs): { didForce: boolean } {
  setGameState((prev) => ({
    ...prev,
    log: [
      ...prev.log,
      `${players[sourcePlayerIndex].name} は ${players[targetIndex].name} に催眠術師を使用しました。`,
    ],
  }));

  // シスター防御
  const defended = trySisterDefense(
    targetIndex,
    gameState,
    players,
    setGameState,
    () => {
      setGameState((prev) => discardUsedCard(prev, sourcePlayerIndex, 9));
    }
  );

  if (defended) {
    return { didForce: false };
  }

  const targetHand = gameState.hands[targetIndex];
  if (targetHand.length === 0) return { didForce: false };

  const forcedCardIndex = Math.floor(Math.random() * targetHand.length);
  const forcedCard = targetHand[forcedCardIndex];

  setGameState((prev) => ({
    ...prev,
    log: [
      ...prev.log,
      `${players[targetIndex].name} の「${forcedCard.name}」が強制発動されます。`,
    ],
  }));

  onForcePlayFromHand(targetIndex, forcedCardIndex);
  return { didForce: true };
}

