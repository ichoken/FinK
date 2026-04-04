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
    const targets = findAttackTargets(activePlayerIndex, gameState, players);

    if (targets.length === 0) {
        // → 警告モーダルへ
        return {
            nextState: gameState,
            pending: {
                kind: 'noTargetWarning',
                player: activePlayerIndex,
                cardNo: 5, // ★ 占い師
            },
            endTurn: false,
        };
    }

    // 対象プレイヤー選択フェーズへ
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