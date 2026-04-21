// src/cpu/cpuMerchant.ts
import type { GameState, PendingAction } from "../types";
import type { PlayerInfo } from "../gameConfig";
import { resolveMerchantHandler } from "../effects/merchantHandler";

export type CpuMerchantArgs = {
    pendingAction: PendingAction;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (prev: number) => number) => void;
    setSelectedIndex: (i: number | null) => void;
};

export function cpuResolveMerchant({
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setSelectedIndex,
}: CpuMerchantArgs) {

    // ★ 型ガード
    if (!pendingAction || pendingAction.kind !== "merchant") return;

    // CPU の手札
    const hand = gameState.hands[activePlayerIndex];
    if (hand.length === 0) {
        // ありえないが安全のため
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // ★ CPU はランダムに 1 枚選ぶ
    const index = Math.floor(Math.random() * hand.length);

    // resolveMerchantHandler を呼ぶ
    resolveMerchantHandler({
        index,
        pendingAction,
        players,
        setGameState,
        setPendingAction,
        setSelectedIndex,
        setActivePlayerIndex,
    });
}
