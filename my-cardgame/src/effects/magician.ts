import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { findAttackTargets } from '../utils/checkTargets';

export function useMagician(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[]
): {
    nextState: GameState;
    pending: PendingAction | null;
    endTurn: boolean;
} {
    // ★ 他プレイヤーの手札が1枚以上あるプレイヤーを抽出
    const targets = findAttackTargets(activePlayerIndex, gameState, players);

    // ★ 他プレイヤー全員が手札0 → 何もせずターン終了
    if (targets.length === 0) {
        return {
            nextState: gameState,
            pending: null,
            endTurn: true,
        };
    }

    // ★ 自分の手札が0 → 何もせずターン終了
    if (gameState.hands[activePlayerIndex].length === 0) {
        return {
            nextState: gameState,
            pending: null,
            endTurn: true,
        };
    }

    // ★ 対象選択フェーズへ
    return {
        nextState: gameState,
        pending: {
            kind: 'magician',
            player: activePlayerIndex,
            step: 'chooseTarget',
        },
        endTurn: false,
    };
}