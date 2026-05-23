import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { resolveSeizureHandler } from '../effects/seizureHandler';
import { advanceToNextPlayer } from '../utils/advanceTurn';

type Args = {
  pendingAction: PendingAction;
  players: PlayerInfo[];
  gameState: GameState;
  setGameState: (fn: (prev: GameState) => GameState) => void;
  setPendingAction: (p: PendingAction | null) => void;
  setActivePlayerIndex: (fn: (n: number) => number) => void;
  setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function cpuResolveSeizure({
  pendingAction,
  players,
  gameState,
  setGameState,
  setPendingAction,
  setActivePlayerIndex,
  setPlayers,
}: Args) {
  if (!pendingAction || pendingAction.kind !== 'seizure') return;

  const player = pendingAction.player;

  const finishWithoutTarget = () => {
    setPendingAction(null);
    setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
  };

  const candidates = players
    .map((_, idx) => idx)
    .filter(
      (idx) =>
        idx !== player &&
        !players[idx].isEliminated &&
        (gameState.hands[idx]?.length ?? 0) < 4,
    );

  if (candidates.length === 0) {
    finishWithoutTarget();
    return;
  }

  const hand = gameState.hands[player] ?? [];
  if (hand.length === 0) {
    finishWithoutTarget();
    return;
  }

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const cardIndex = Math.floor(Math.random() * hand.length);

  resolveSeizureHandler({
    pendingAction: {
      kind: 'seizure',
      player,
      step: 'chooseCard',
      target,
    },
    activePlayerIndex: player,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
    cardIndex,
  });
}
