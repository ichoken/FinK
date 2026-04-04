// src/utils/checkTargets.ts
import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';

export function findAttackTargets(
    activePlayerIndex: number,
    gameState: GameState,
    players: PlayerInfo[]
): number[] {
    return players
        .map((p, i) => ({ i, hand: gameState.hands[i] }))
        .filter((p) => p.i !== activePlayerIndex && p.hand.length > 0)
        .map((p) => p.i);
}