// src/effects/blackMagicianHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { shuffleArray } from '../eliminationHandlers';

type Args = {
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function resolveBlackMagicianHandler({
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
}: Args) {
    const playerName = players[activePlayerIndex].name;

    setGameState(prev => {
        const hand = prev.hands[activePlayerIndex];
        const cardsToShuffle = [...hand, ...prev.deck];
        const newDeck = shuffleArray(cardsToShuffle);

        const newHands = prev.hands.map((h, i) => (i === activePlayerIndex ? [] : h));

        return {
            ...prev,
            deck: newDeck,
            hands: newHands,
            log: [
                ...prev.log,
                `${playerName} は黒魔術師の効果により手札と山札をすべてシャッフルしました。`,
            ],
        };
    });

    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}
