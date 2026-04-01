// src/victoryCheck.ts
import type { GameState } from './types';
import type { PlayerInfo } from './gameConfig';

export type VictoryResult = {
    win: boolean;
    winners: number[];
};

/**
 * ① 手札変化後の勝利判定（シスター4枚）
 * - playerIndex の手札だけを見る
 */
export function checkVictoryOnHandChange(
    playerIndex: number,
    state: GameState
): VictoryResult {
    const SISTER_NO = 7;
    const hand = state.hands[playerIndex] ?? [];

    const sisterCount = hand.filter((c) => c.no === SISTER_NO).length;

    if (sisterCount >= 4) {
        return { win: true, winners: [playerIndex] };
    }

    return { win: false, winners: [] };
}

/**
 * ② 脱落後の勝利判定（生存者が1人）
 * - players の isEliminated を見る
 */
export function checkVictoryOnElimination(players: PlayerInfo[]): VictoryResult {
    const alive = players
        .map((p, idx) => ({ idx, alive: !p.isEliminated }))
        .filter((p) => p.alive)
        .map((p) => p.idx);

    if (alive.length === 1) {
        return { win: true, winners: [alive[0]] };
    }

    return { win: false, winners: [] };
}

/**
 * ③ 山札0枚の勝利判定（FinK 所持者）
 * - state.deck.length === 0 のときに呼ぶ
 * - FinK 所持者が複数なら複数勝利
 * - FinK 所持者がいない場合は引き分け扱い（winners: []）
 */
export function checkVictoryOnDeckEmpty(
    state: GameState,
    players: PlayerInfo[]
): VictoryResult {
    const FINK_NO = 12;

    if (state.deck.length > 0) {
        return { win: false, winners: [] };
    }

    const winners: number[] = [];

    state.hands.forEach((hand, idx) => {
        if (players[idx].isEliminated) return;
        if (hand.some((c) => c.no === FINK_NO)) {
            winners.push(idx);
        }
    });

    // 山札0枚 → 勝利判定は必ず発生する
    return { win: true, winners };
}