// src/effects/confusionHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';

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
    activePlayerIndex,
    players,
    gameState,
    setPendingAction,
    setActivePlayerIndex,
}: ResolveConfusionArgs) {
    if (!pendingAction || pendingAction.kind !== 'confusion') return;

    // CPU の混乱 UI を閉じるだけ
    setPendingAction(null);

    // ターン終了
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}
