// src/effects/useFortuneTeller.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';

export function useFortuneTeller(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[]
): {
    nextState: GameState;
    pending: PendingAction | null;
    endTurn: boolean;
} {
    const myHand = gameState.hands[activePlayerIndex];

    // 他プレイヤーの手札が全員0枚 → 何もせずターン終了
    const others = players
        .map((p, i) => ({ i, hand: gameState.hands[i] }))
        .filter((p) => p.i !== activePlayerIndex);

    const othersWithCards = others.filter((p) => p.hand.length > 0);
    if (othersWithCards.length === 0) {
        return {
            nextState: {
                ...gameState,
                log: [...gameState.log, `${players[activePlayerIndex].name} は占い師を使用したが対象がいませんでした。`],
            },
            pending: null,
            endTurn: true,
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