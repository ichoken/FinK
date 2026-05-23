// src/effects/seizureHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';
import { advanceToNextPlayer } from '../utils/advanceTurn';

type Args = {
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
    cardIndex: number;
};

export function resolveSeizureHandler(args: Args) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
        cardIndex,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'seizure') return;
    if (pendingAction.target === undefined) return;

    const target = pendingAction.target;

    setGameState(prev => {
        const giveCard = prev.hands[activePlayerIndex]?.[cardIndex];
        if (!giveCard) {
            return prev;
        }

        const hands = prev.hands.map(h => [...h]);
        hands[activePlayerIndex].splice(cardIndex, 1);
        hands[target].push(giveCard);

        let next: GameState = {
            ...prev,
            hands,
            log: [
                ...prev.log,
                `${players[activePlayerIndex].name} は ${players[target].name} に ${giveCard.name} を差し押さえで渡しました。`,
            ],
        };

        const result = checkHandChangeCombined(next, players);

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

        return next;
    });

    setPendingAction(null);
    setActivePlayerIndex(prev => advanceToNextPlayer(prev, players));
}
