// src/utils/sisterDefense.ts
import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';

export function trySisterDefense(
    targetIndex: number,
    gameState: GameState,
    players: PlayerInfo[],
    setGameState: React.Dispatch<React.SetStateAction<GameState>>
): boolean {
    const targetHand = gameState.hands[targetIndex];
    const sisterIndex = targetHand.findIndex((c) => c.no === 7);

    // シスターがない → 防御なし
    if (sisterIndex === -1) return false;

    // シスターを1枚破棄
    const nextHands = gameState.hands.map((h) => [...h]);
    const [sisterCard] = nextHands[targetIndex].splice(sisterIndex, 1);

    setGameState((prev) => ({
        ...prev,
        hands: nextHands,
        discard: [...prev.discard, sisterCard],
        log: [
            ...prev.log,
            `${players[targetIndex].name} のシスターが発動し、攻撃を無効化しました。`,
        ],
    }));

    return true;
}