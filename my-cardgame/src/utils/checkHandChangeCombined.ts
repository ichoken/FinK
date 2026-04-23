import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { checkVictoryOnHandChange } from '../victoryCheck';
import { checkElimination } from '../eliminationCheck';

export type HandChangeResult = {
    win: boolean;
    winners: number[];
    eliminated: number[];
};

/**
 * 手札変化時の総合チェック
 * - シスター4枚 → 勝利
 * - シスター3枚 + FinK → 脱落
 * - シスター3枚 + 黒魔術師 → 脱落
 * - FinK + 黒魔術師 → 脱落
 */
export function checkHandChangeCombined(
    state: GameState,
    players: PlayerInfo[]
): HandChangeResult {
    const eliminated: number[] = [];
    const winners: number[] = [];

    for (let i = 0; i < players.length; i++) {
        if (players[i].isEliminated) continue;

        // ① シスター4枚 → 勝利
        const v = checkVictoryOnHandChange(i, state);
        if (v.win) {
            winners.push(i);
            continue;
        }

        // ② 脱落条件
        const e = checkElimination(i, state);
        if (e.eliminated) {
            eliminated.push(i);
            continue;
        }
    }

    return {
        win: winners.length > 0,
        winners,
        eliminated,
    };
}