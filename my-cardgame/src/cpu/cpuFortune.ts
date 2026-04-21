// src/cpu/cpuFortune.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";
import { resolveFortuneTargetHandler } from "../effects/fortuneHandler";
import { finishFortuneHandler } from "../effects/fortuneFinishHandler";
import { findAttackTargets } from "../utils/checkTargets";

export type CpuFortuneArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
};

export function cpuResolveFortune({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
}: CpuFortuneArgs) {

    // ★ 型ガード
    if (!pendingAction || pendingAction.kind !== "fortune") return;

    // -----------------------------
    // ① chooseTarget フェーズ
    // -----------------------------
    if (pendingAction.step === "chooseTarget") {

        const targets = findAttackTargets(activePlayerIndex, gameState, players);

        if (targets.length === 0) {
            // 対象がいない → noTargetWarning と同じ扱い
            setPendingAction(null);
            setActivePlayerIndex(prev => (prev + 1) % players.length);
            return;
        }

        // ★ CPU はランダムに対象を選ぶ
        const target = targets[Math.floor(Math.random() * targets.length)];

        resolveFortuneTargetHandler({
            targetIndex: target,
            pendingAction,
            activePlayerIndex,
            players,
            gameState,
            setGameState,
            setPendingAction,
            setActivePlayerIndex,
        });

        return;
    }

    // -----------------------------
    // ② showHand フェーズ
    // -----------------------------
    if (pendingAction.step === "showHand") {
        // CPU は UI を使わないので即終了
        finishFortuneHandler({
            pendingAction,
            players,
            setPendingAction,
            setActivePlayerIndex,
        });
        return;
    }
}
