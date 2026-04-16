// src/effects/finkHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';

type Args = {
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

export function resolveFinKHandler({
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
}: Args) {

    // 即脱落
    eliminatePlayerAndUpdate({
        playerIndex: activePlayerIndex,
        players,
        setPlayers,
        setGameState,
    });

    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}
