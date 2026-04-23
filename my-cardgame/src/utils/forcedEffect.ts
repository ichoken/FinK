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

    const drawnCard = next.hands[activePlayerIndex].slice(-1)[0];
    if (!drawnCard) return next;

    switch (drawnCard?.no) {
        // --------------------------------------
        // No.10 差し押さえ（強制発動）
        // --------------------------------------
        case 10: {
            // 使用カード（差し押さえ No.10）を墓地へ
            setGameState(prev => discardUsedCard(prev, activePlayerIndex, 10));

            // 対象選択 UI を出す
            setPendingAction({
                kind: 'seizure',
                player: activePlayerIndex,
                step: 'chooseTarget',
            });
            return next;
        }
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
