// src/utils/forcedEffect.ts
import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { checkHandChangeCombined } from './checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';

export function applyForcedEffect(
    gameState: GameState,
    activePlayerIndex: number,
    card: { no: number; name: string }
): GameState {
    let next = { ...gameState };

    switch (card.no) {
        // --------------------------------------
        // No.10 差し押さえ
        // --------------------------------------
        case 10: {
            const myHand = next.hands[activePlayerIndex];
            const others = next.hands.map((h, i) => i).filter(i => i !== activePlayerIndex);

            // 手札0 → 何も起きない
            if (myHand.length === 0) return next;

            // 手札4未満の相手を探す
            const candidates = others.filter(i => next.hands[i].length < 4);
            if (candidates.length === 0) return next;

            // CPU なのでランダムで選ぶ（人間 UI は別で処理）
            const target = candidates[Math.floor(Math.random() * candidates.length)];

            // 自分の手札からランダムで1枚選ぶ
            const giveIndex = Math.floor(Math.random() * myHand.length);
            const [giveCard] = myHand.splice(giveIndex, 1);

            // 相手に渡す
            next.hands[target].push(giveCard);

            // 勝利/脱落判定（相手のみ）
            const result = checkHandChangeCombined(next, next.players);

            result.eliminated.forEach(idx => {
                eliminatePlayerAndUpdate({
                    playerIndex: idx,
                    players: next.players,
                    setPlayers: () => { },
                    setGameState: () => { },
                });
            });

            if (result.win) {
                handleGameOver({
                    winners: result.winners,
                    players: next.players,
                    setGameState: () => { },
                });
            }

            return next;
        }

        // --------------------------------------
        // No.11 混乱
        // --------------------------------------
        case 11: {
            // 手札0 → 何も起きない
            if (next.hands[activePlayerIndex].length === 0) return next;

            // 公開ログを追加するだけ
            next = {
                ...next,
                log: [
                    ...next.log,
                    `${next.players[activePlayerIndex].name} の手札が公開されました。`,
                ],
            };

            return next;
        }

        default:
            return next;
    }
}
