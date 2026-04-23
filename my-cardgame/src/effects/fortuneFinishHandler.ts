// src/effects/fortuneFinishHandler.ts
import type { PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';

type FinishFortuneArgs = {
    pendingAction: PendingAction | null;
    players: PlayerInfo[];
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function finishFortuneHandler({
    pendingAction,
    players,
    setPendingAction,
    setActivePlayerIndex,
}: FinishFortuneArgs) {
    if (!pendingAction || pendingAction.kind !== 'fortune') return;

    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}