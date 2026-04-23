// src/cpu/cpuProphet.ts
import { resolveProphetHandler } from "../effects/prophetHandler";
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";

export type CpuProphetArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
};

export function cpuResolveProphet({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
}: CpuProphetArgs) {
    if (!pendingAction || pendingAction.kind !== "prophet") return;
    const cards = pendingAction.cards;

    // CPU はランダムに並び替える
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    resolveProphetHandler({
        pendingAction,
        players,
        activePlayerIndex,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,

        // ★ CPU の並び替え結果を渡す
        orderedCards: shuffled,
    });
}
