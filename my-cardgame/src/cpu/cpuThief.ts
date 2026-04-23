// src/cpu/cpuThief.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";
import { resolveThiefTargetHandler } from "../effects/thiefHandler";
import { findAttackTargets } from "../utils/checkTargets";

export type CpuThiefArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function cpuResolveThief({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
}: CpuThiefArgs) {

    // ★ 型ガード
    if (!pendingAction || pendingAction.kind !== "thief") return;

    // ★ CPU が対象候補を取得（useThief と同じロジック）
    const targets = findAttackTargets(activePlayerIndex, gameState, players);

    if (targets.length === 0) {
        // 対象がいない → noTargetWarning と同じ扱い
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // ★ CPU はランダムに対象を選ぶ
    const target = targets[Math.floor(Math.random() * targets.length)];

    // ★ resolveThiefTargetHandler を呼ぶ
    resolveThiefTargetHandler({
        targetIndex: target,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
    });
}
