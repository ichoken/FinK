// src/effects/confusionHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { advanceToNextPlayer } from '../utils/advanceTurn';

type ResolveConfusionArgs = {
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function resolveConfusionHandler({
    pendingAction,
    players,
    setPendingAction,
    setActivePlayerIndex,
}: ResolveConfusionArgs) {
    if (!pendingAction || pendingAction.kind !== 'confusion') return;

    setPendingAction(null);
    setActivePlayerIndex(prev => advanceToNextPlayer(prev, players));
}
