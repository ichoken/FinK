// src/effects/merchantHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';

type ResolveMerchantArgs = {
    index: number;
    pendingAction: PendingAction | null;
    players: PlayerInfo[];
    setGameState: (updater: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setSelectedIndex: (i: number | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function resolveMerchantHandler({
    index,
    pendingAction,
    players,
    setGameState,
    setPendingAction,
    setSelectedIndex,
    setActivePlayerIndex,
}: ResolveMerchantArgs) {
    if (!pendingAction || pendingAction.kind !== 'merchant') return;

    const p = pendingAction.player;

    setGameState((prev) => {
        const nextHands = prev.hands.map((h) => [...h]);
        const [chosen] = nextHands[p].splice(index, 1);

        return {
            deck: [chosen, ...prev.deck],
            hands: nextHands,
            discard: prev.discard,
            log: [
                ...prev.log,
                `${players[p].name} は商人の効果で ${chosen.name} を山札の一番上に戻しました。`,
            ],
        };
    });

    setPendingAction(null);
    setSelectedIndex(null);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
}