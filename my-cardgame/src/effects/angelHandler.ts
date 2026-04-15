// src/effects/angelHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';

import { discardUsedCard } from '../utils/discardUsedCard';
import { applyForcedEffect } from '../utils/forcedEffect';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';

type ResolveAngelArgs = {
    discardIndex: number;
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function resolveAngelHandler({
    discardIndex,
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
}: ResolveAngelArgs) {
    if (!pendingAction || pendingAction.kind !== 'angel') return;

    // --------------------------------------
    // Step1: 使用カード（天使 No.8）を墓地へ送る
    // --------------------------------------
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 8));

    // --------------------------------------
    // Step2: 墓地からカードを取り出す
    // --------------------------------------
    const chosenCard = gameState.discard[discardIndex];

    // --------------------------------------
    // Step3: 強制発動 ON → 即発動
    // --------------------------------------
    if (chosenCard.type === 'force') {
        setGameState(prev => applyForcedEffect(prev, activePlayerIndex, chosenCard));

        // 強制発動後の勝利/脱落判定
        setGameState(prev => {
            const result = checkHandChangeCombined(prev, players);

            result.eliminated.forEach(idx => {
                eliminatePlayerAndUpdate({
                    playerIndex: idx,
                    players,
                    setPlayers,
                    setGameState,
                });
            });

            if (result.win) {
                handleGameOver({
                    winners: result.winners,
                    players,
                    setGameState,
                });
            }

            return prev;
        });

        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // --------------------------------------
    // Step4: 強制発動 OFF → 手札に加える
    // --------------------------------------
    setGameState(prev => {
        const discard = [...prev.discard];
        discard.splice(discardIndex, 1);

        const hands = prev.hands.map(h => [...h]);
        hands[activePlayerIndex].push(chosenCard);

        const updated: GameState = {
            ...prev,
            discard,
            hands,
        };

        // --------------------------------------
        // Step5: 勝利/脱落判定（マジシャンと同じ）
        // --------------------------------------
        const result = checkHandChangeCombined(updated, players);

        result.eliminated.forEach(idx => {
            eliminatePlayerAndUpdate({
                playerIndex: idx,
                players,
                setPlayers,
                setGameState,
            });
        });

        if (result.win) {
            handleGameOver({
                winners: result.winners,
                players,
                setGameState,
            });
        }

        return updated;
    });

    // --------------------------------------
    // Step6: ターン終了
    // --------------------------------------
    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}
