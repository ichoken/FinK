import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { resolveSeizureHandler } from '../effects/seizureHandler';

type Args = {
  pendingAction: PendingAction;
  activePlayerIndex: number;
  players: PlayerInfo[];
  gameState: GameState;
  setGameState: (fn: (prev: GameState) => GameState) => void;
  setPendingAction: (p: PendingAction | null) => void;
  setActivePlayerIndex: (fn: (n: number) => number) => void;
  setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function cpuResolveSeizure({
  pendingAction,
  activePlayerIndex,
  players,
  gameState,
  setGameState,
  setPendingAction,
  setActivePlayerIndex,
  setPlayers,
}: Args) {
  if (!pendingAction || pendingAction.kind !== 'seizure') return;

  if (pendingAction.step === 'chooseTarget') {
    const candidates = players
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          idx !== pendingAction.player &&
          !players[idx].isEliminated &&
          gameState.hands[idx].length < 4,
      );

    if (candidates.length === 0) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    setPendingAction({
      kind: 'seizure',
      player: pendingAction.player,
      step: 'chooseCard',
      target,
    });
    return;
  }

  if (pendingAction.step === 'chooseCard') {
    const hand = gameState.hands[activePlayerIndex];
    if (hand.length === 0) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }
    const cardIndex = Math.floor(Math.random() * hand.length);
    resolveSeizureHandler({
      pendingAction,
      activePlayerIndex,
      players,
      gameState,
      setGameState,
      setPendingAction,
      setActivePlayerIndex,
      setPlayers,
      cardIndex,
    });
  }
}
