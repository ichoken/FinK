// src/effects/useFortuneTeller.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { findAttackTargets } from '../utils/checkTargets';

export function useFortuneTeller(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[]
): {
    nextState: GameState;
    pending: PendingAction | null;
    endTurn: boolean;
} {
    // ★ 1. 使用した占い師カードを破棄
    const nextHands = gameState.hands.map((h) => [...h]);
    const idx = nextHands[activePlayerIndex].findIndex((c) => c.no === 5);
    const [usedCard] = nextHands[activePlayerIndex].splice(idx, 1);

    let nextState: GameState = {
        ...gameState,
        hands: nextHands,
        discard: [...gameState.discard, usedCard],
        log: [
            ...gameState.log,
            `${players[activePlayerIndex].name} は占い師を使用しました。`,
        ],
    };

    // ★ 2. 対象者チェック（汎用化）
    const targets = findAttackTargets(activePlayerIndex, nextState, players);

    if (targets.length === 0) {
        return {
            nextState,
            pending: {
                kind: 'noTargetWarning',
                player: activePlayerIndex,
                cardNo: 5,
            },
            endTurn: false,
        };
    }

    // ★ 3. 対象選択フェーズへ
    return {
        nextState,
        pending: {
            kind: 'fortune',
            player: activePlayerIndex,
            step: 'chooseTarget',
        },
        endTurn: false,
    };
}