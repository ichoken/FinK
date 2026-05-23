// src/cpu/cpuThief.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";
import { resolveThiefTargetHandler } from "../effects/thiefHandler";
import { findAttackTargets } from "../utils/checkTargets";
import { advanceToNextPlayer } from "../utils/advanceTurn";

export type CpuThiefArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
    onShowActivation?: (cardNo: number, sourceIndex: number, targetIndex?: number) => Promise<void>;
    onShowCardMessageOverlay?: (cardNos: number[], message: string) => Promise<void>;
};

export async function cpuResolveThief({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
    onShowActivation,
    onShowCardMessageOverlay,
}: CpuThiefArgs) {
    if (!pendingAction || pendingAction.kind !== "thief") return;

    const targets = findAttackTargets(activePlayerIndex, gameState, players);

    if (targets.length === 0) {
        setPendingAction(null);
        setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
        return;
    }

    const target = targets[Math.floor(Math.random() * targets.length)];

    if (onShowActivation) {
        await onShowActivation(4, activePlayerIndex, target);
    }

    await resolveThiefTargetHandler({
        targetIndex: target,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
        onShowCardMessageOverlay,
    });
}
