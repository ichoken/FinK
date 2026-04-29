// src/utils/sisterDefense.ts
import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';

export async function trySisterDefense(
    targetIndex: number,
    gameState: GameState,
    players: PlayerInfo[],
    setGameState: (updater: any) => void,
    discardCallback: () => void,
    onShowCardMessageOverlay?: (cardNos: number[], message: string) => Promise<void>,
): Promise<boolean> {
    // ★ 現在の target の手札を参照
    const targetHand = gameState.hands[targetIndex];
    const sisterIdx = targetHand.findIndex(c => c.no === 7);

    // シスターがない → 防御なし
    if (sisterIdx === -1) return false;

    if (onShowCardMessageOverlay) {
        await onShowCardMessageOverlay(
            [7],
            `${players[targetIndex].name} のシスターが効果を無効化しました。`,
        );
    }
    // ★ 使用カードを破棄（共通処理）
    discardCallback();

    // ★ シスター破棄（prev ベースで確実に行う）
    setGameState(prev => {
        const nextHands = prev.hands.map(h => [...h]);

        // prev ベースで sisterIdx を再計算（これが重要）
        const idx = nextHands[targetIndex].findIndex(c => c.no === 7);
        if (idx !== -1) {
            const [sister] = nextHands[targetIndex].splice(idx, 1);

            return {
                ...prev,
                hands: nextHands,
                discard: [...prev.discard, sister],
                log: [
                    ...prev.log,
                    `${players[targetIndex].name} のシスターが効果を無効化しました。`,
                ],
            };
        }

        return prev;
    });

    return true;
}