// src/effects/useFortuneTeller.ts
import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { findAttackTargets } from '../utils/checkTargets';

export function useFortuneTeller(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[]
) {
    // ★ 対象者チェックのみ
    const targets = findAttackTargets(activePlayerIndex, gameState, players);

    if (targets.length === 0) {
        return {
            nextState: gameState,
            pending: {
                kind: 'noTargetWarning',
                player: activePlayerIndex,
                cardNo: 5,
            },
            endTurn: false,
        };
    }

    // ★ 対象選択フェーズへ
    return {
        nextState: gameState,
        pending: {
            kind: 'fortune',
            player: activePlayerIndex,
            step: 'chooseTarget',
        },
        endTurn: false,
    };
}
