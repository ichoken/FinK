// src/eliminationCheck.ts
import type { GameState } from './types';

export type EliminationResult = {
    eliminated: boolean;
    reason: string | null;
};

/**
 * 手札の内容だけで脱落条件を判定する純粋関数
 * - FinK 使用による脱落はここでは扱わない（playFromHand 側で処理）
 */
export function checkElimination(playerIndex: number, state: GameState): EliminationResult {
    const hand = state.hands[playerIndex] ?? [];

    const BLACK_NO = 6;   // 黒魔術師
    const SISTER_NO = 7;  // シスター
    const FINK_NO = 12;   // FinK

    const hasBlack = hand.some((c) => c.no === BLACK_NO);
    const hasFinK = hand.some((c) => c.no === FINK_NO);
    const sisterCount = hand.filter((c) => c.no === SISTER_NO).length;

    // ① シスター3枚 + 黒魔術師
    if (sisterCount >= 3 && hasBlack) {
        return {
            eliminated: true,
            reason: 'シスター3枚 + 黒魔術師',
        };
    }

    // ② シスター3枚 + FinK
    if (sisterCount >= 3 && hasFinK) {
        return {
            eliminated: true,
            reason: 'シスター3枚 + FinK',
        };
    }

    // ③ FinK + 黒魔術師
    if (hasFinK && hasBlack) {
        return {
            eliminated: true,
            reason: 'FinK + 黒魔術師',
        };
    }

    return { eliminated: false, reason: null };
}