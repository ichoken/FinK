// src/effects/useAngel.ts
import type { GameState, PendingAction } from '../types';

export function useAngel(
    gameState: GameState,
    activePlayerIndex: number
): {
    nextState: GameState;
    pending: PendingAction | null;
    endTurn: boolean;
} {
    // ① 天使カードを墓地へ送る（App 側で removeCardFromHand を使うなら不要）
    // ここでは gameState は「天使を墓地に送った後」の状態として扱う前提

    // ② 墓地が空なら何もせずターン終了
    if (gameState.discard.length === 0) {
        return {
            nextState: gameState,
            pending: null,
            endTurn: true,
        };
    }

    // ③ 墓地選択 UI を出す
    return {
        nextState: gameState,
        pending: {
            kind: 'angel',
            player: activePlayerIndex,
        },
        endTurn: false,
    };
}
