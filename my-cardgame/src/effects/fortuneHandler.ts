// src/effects/fortuneHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { trySisterDefense } from '../utils/sisterDefense';
import { discardUsedCard } from '../utils/discardUsedCard';

type ResolveFortuneArgs = {
    targetIndex: number;
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (updater: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function resolveFortuneTargetHandler({
    targetIndex,
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
}: ResolveFortuneArgs) {
    if (!pendingAction || pendingAction.kind !== 'fortune') return;

    // ログ追加
    setGameState(prev => ({
        ...prev,
        log: [
            ...prev.log,
            `${players[activePlayerIndex].name} が ${players[targetIndex].name} に対して占い師を発動しました。`,
        ],
    }));

    // シスター防御
    const defended = trySisterDefense(
        targetIndex,
        gameState,
        players,
        setGameState,
        () => {
            setGameState(prev => discardUsedCard(prev, activePlayerIndex, 5));
        }
    );

    if (defended) {
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // シスター防御なし → 使用カード破棄
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 5));

    // 手札公開フェーズへ
    setPendingAction({
        kind: 'fortune',
        player: activePlayerIndex,
        step: 'showHand',
        target: targetIndex,
    });
}