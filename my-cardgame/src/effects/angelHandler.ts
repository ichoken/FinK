// src/effects/angelHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { discardUsedCard } from '../utils/discardUsedCard';
import { applyForcedEffect } from '../utils/forcedEffect';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerPure } from '../eliminationHandlers';
import { advanceToNextPlayer } from '../utils/advanceTurn';

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

function applyHandChecks(
    state: GameState,
    players: PlayerInfo[],
    setPlayers: ResolveAngelArgs['setPlayers'],
): GameState {
    let updated = state;
    const result = checkHandChangeCombined(updated, players);

    result.eliminated.forEach((idx) => {
        updated = eliminatePlayerPure(idx, updated, players);
        setPlayers((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, isEliminated: true } : p)),
        );
    });

    if (result.win) {
        const winnerNames = result.winners.map((i) => players[i].name).join('、');
        updated = {
            ...updated,
            gameOver: true,
            winners: result.winners,
            log: [...updated.log, `ゲーム終了！勝者: ${winnerNames}`],
        };
    }

    return updated;
}

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
    if (discardIndex < 0 || discardIndex >= gameState.discard.length) return;

    let next = discardUsedCard(gameState, activePlayerIndex, 8);

    const discard = [...next.discard];
    if (discardIndex >= discard.length) {
        setPendingAction(null);
        setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
        return;
    }

    const [picked] = discard.splice(discardIndex, 1);
    next = { ...next, discard };

    let forcePending: PendingAction | null = null;

    if (picked.type === 'force') {
        const hands = next.hands.map((h) => [...h]);
        hands[activePlayerIndex] = [...hands[activePlayerIndex], picked];
        const withCard = { ...next, hands };
        const forced = applyForcedEffect(withCard, activePlayerIndex, players);
        next = applyHandChecks(forced.state, players, setPlayers);
        forcePending = forced.pending;
    } else {
        const hands = next.hands.map((h) => [...h]);
        hands[activePlayerIndex].push(picked);
        next = {
            ...next,
            hands,
            log: [
                ...next.log,
                `${players[activePlayerIndex].name} は墓地から ${picked.name} を手札に加えました。`,
            ],
        };
        next = applyHandChecks(next, players, setPlayers);
    }

    setGameState(next);

    if (forcePending) {
        setPendingAction(forcePending);
        return;
    }

    setPendingAction(null);
    setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
}
