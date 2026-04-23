// src/cpu/cpuAngel.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";
import { resolveAngelHandler } from "../effects/angelHandler";

export type CpuAngelArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function cpuResolveAngel({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
}: CpuAngelArgs) {

    // ★ 型ガード
    if (!pendingAction || pendingAction.kind !== "angel") return;

    const discard = gameState.discard;

    // 墓地が空ならターン終了（useAngel 側で既に処理済みのはずだが安全のため）
    if (discard.length === 0) {
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // ★ CPU は墓地からランダムに 1 枚選ぶ
    const discardIndex = Math.floor(Math.random() * discard.length);

    // resolveAngelHandler を呼ぶ
    resolveAngelHandler({
        discardIndex,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
    });
}
