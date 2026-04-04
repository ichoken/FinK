// src/utils/discardUsedCard.ts
import type { GameState } from '../types';

export function discardUsedCard(
    prev: GameState,
    playerIndex: number,
    cardNo: number
): GameState {
    const nextHands = prev.hands.map(h => [...h]);
    const idx = nextHands[playerIndex].findIndex(c => c.no === cardNo);

    if (idx === -1) return prev; // すでに破棄済みなど

    const [usedCard] = nextHands[playerIndex].splice(idx, 1);

    return {
        ...prev,
        hands: nextHands,
        discard: [...prev.discard, usedCard],
    };
}