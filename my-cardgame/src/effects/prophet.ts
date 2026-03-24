import type { GameState, PlayerInfo, CardDefinition, PendingAction } from '../types';

type ProphetResult = {
    nextState: GameState;
    pending: PendingAction;
    endTurn: boolean;
};

export function useProphet(
    prev: GameState,
    activePlayer: number,
    players: PlayerInfo[]
): ProphetResult {
    // 山札の上から最大4枚を取り出す
    const count = Math.min(4, prev.deck.length);
    const viewed = prev.deck.slice(0, count);
    const rest = prev.deck.slice(count);

    return {
        nextState: {
            ...prev,
            deck: rest,
            log: [
                ...prev.log,
                `${players[activePlayer].name} が預言者を使用しました。山札の上から ${count} 枚を確認します。`,
            ],
        },
        pending: {
            kind: 'prophet',
            player: activePlayer,
            cards: viewed, // ← ここに保持
        },
        endTurn: false, // まだ並び替えが終わっていないのでターンは終わらない
    };
}