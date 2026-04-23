// src/effects/useThief.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { findAttackTargets } from '../utils/checkTargets';

export function useThief(
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
        return {
            nextState: gameState,
            pending: {
                kind: 'noTargetWarning',
                player: activePlayerIndex,
                cardNo: 4, // ★ シーフ
            },
            endTurn: false,
        };
    }

    return {
        nextState: gameState,
        pending: {
            kind: 'thief',
            player: activePlayerIndex,
            step: 'chooseTarget',
        },
        endTurn: false,
    };
}