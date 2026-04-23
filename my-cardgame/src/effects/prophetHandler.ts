// src/effects/prophetHandler.ts
import type { GameState, PendingAction, CardDefinition } from '../types';
import type { PlayerInfo } from '../gameConfig';

type ResolveProphetArgs = {
    pendingAction: PendingAction | null;
    players: PlayerInfo[];
    activePlayerIndex: number;
    gameState: GameState;
    setGameState: (updater: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    orderedCards?: CardDefinition[];
};

export function resolveProphetHandler({
    pendingAction,
    players,
    activePlayerIndex,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    orderedCards,
}: ResolveProphetArgs) {
    if (!pendingAction || pendingAction.kind !== 'prophet') return;

    const p = pendingAction.player;
    const ordered = orderedCards ?? pendingAction.cards;

    setGameState((prev) => {
        const nextHands = prev.hands.map((h) => [...h]);
        const idx = nextHands[p].findIndex((c) => c.no === 1);
        const [usedCard] = nextHands[p].splice(idx, 1);

        return {
            deck: [...ordered, ...prev.deck],
            hands: nextHands,
            discard: [...prev.discard, usedCard],
            log: [
                ...prev.log,
                `${players[p].name} は預言者を使用し、山札の上を並び替えました。`,
            ],
        };
    });

    setPendingAction(null);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
}