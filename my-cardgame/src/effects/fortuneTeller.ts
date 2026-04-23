// src/effects/useFortuneTeller.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { findAttackTargets } from '../utils/checkTargets';

type FortuneResult = {
    nextState: GameState;
    pending: PendingAction;
    endTurn: boolean;
};

export function useFortuneTeller(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[]
): FortuneResult {

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
