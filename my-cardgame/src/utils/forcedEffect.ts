// src/utils/forcedEffect.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { discardUsedCard } from '../utils/discardUsedCard';

export function applyForcedEffect(
    gameState: GameState,
    activePlayerIndex: number,
    players: PlayerInfo[],
    setGameState: (fn: (prev: GameState) => GameState) => void,
    setPendingAction: (p: PendingAction | null) => void
): GameState {
    let next = { ...gameState };

    const card = next.hands[activePlayerIndex].find(c => c.no === 11);
    // ※ 呼び出し元でカードを渡す場合はこの行は不要

    switch (card?.no) {
        // --------------------------------------
        // No.11 混乱（強制発動）
        // --------------------------------------
        case 11: {
            setGameState(prev => discardUsedCard(prev, activePlayerIndex, 11));

            if (players[activePlayerIndex].kind == "human") {
                // 人間 → ログのみ
                return {
                    ...next,
                    log: [
                        ...next.log,
                        `${players[activePlayerIndex].name} の手札が公開されました。`,
                    ],
                };
            }

            // CPU → UI 表示のため pendingAction をセット
            setPendingAction({
                kind: 'confusion',
                player: activePlayerIndex,
            });

            return {
                ...next,
                log: [
                    ...next.log,
                    `${players[activePlayerIndex].name} の手札が公開されました。`,
                ],
            };
        }

        default:
            return next;
    }
}
