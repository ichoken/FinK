// src/cpu/cpuMagician.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";

import {
    resolveMagicianTargetHandler,
    chooseMagicianSelfCardHandler,
    chooseMagicianOpponentCardAutoHandler,
    resolveMagicianSwapHandler,
} from "../effects/magicianHandler";

import { findAttackTargets } from "../utils/checkTargets";

export type CpuMagicianArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function cpuResolveMagician({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
}: CpuMagicianArgs) {
    if (!pendingAction || pendingAction.kind !== "magician") return;

    // Step1: 対象選択フェーズ
    if (pendingAction.step === "chooseTarget") {
        const targets = findAttackTargets(activePlayerIndex, gameState, players);

        if (targets.length === 0) {
            // 念のため：対象がいなければターン終了
            setPendingAction(null);
            setActivePlayerIndex(prev => (prev + 1) % players.length);
            return;
        }

        const target = targets[Math.floor(Math.random() * targets.length)];

        resolveMagicianTargetHandler(target, {
            pendingAction,
            activePlayerIndex,
            players,
            gameState,
            setGameState,
            setPendingAction,
            setActivePlayerIndex,
            setPlayers,
        });

        return;
    }

    // Step2: 自分のカード選択フェーズ
    if (pendingAction.step === "chooseSelfCard") {
        const selfHand = gameState.hands[activePlayerIndex];
        if (selfHand.length === 0) {
            setPendingAction(null);
            setActivePlayerIndex(prev => (prev + 1) % players.length);
            return;
        }

        const selfCardIndex = Math.floor(Math.random() * selfHand.length);

        chooseMagicianSelfCardHandler(selfCardIndex, {
            pendingAction,
            activePlayerIndex,
            players,
            gameState,
            setGameState,
            setPendingAction,
            setActivePlayerIndex,
            setPlayers,
        });

        return;
    }

    // Step3: 相手カード選択フェーズ（CPU 自動）
    if (pendingAction.step === "chooseOpponentCard") {
        chooseMagicianOpponentCardAutoHandler({
            pendingAction,
            activePlayerIndex,
            players,
            gameState,
            setGameState,
            setPendingAction,
            setActivePlayerIndex,
            setPlayers,
        });

        return;
    }

    // Step4: 交換処理フェーズ（CPU は即実行）
    if (pendingAction.step === "swap") {
        resolveMagicianSwapHandler({
            pendingAction,
            activePlayerIndex,
            players,
            gameState,
            setGameState,
            setPendingAction,
            setActivePlayerIndex,
            setPlayers,
        });

        return;
    }
}
