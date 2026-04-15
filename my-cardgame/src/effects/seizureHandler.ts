// src/effects/seizureHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { discardUsedCard } from '../utils/discardUsedCard';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';

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
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
        cardIndex,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'seizure') return;

    const target = pendingAction.target!;
    const giveCard = gameState.hands[activePlayerIndex][cardIndex];

    // カードを渡す
    setGameState(prev => {
        const hands = prev.hands.map(h => [...h]);

        // 自分の手札から取り除く
        hands[activePlayerIndex].splice(cardIndex, 1);

        // 相手に渡す
        hands[target].push(giveCard);

        let next: GameState = {
            ...prev,
            hands,
            log: [
                ...prev.log,
                `${players[activePlayerIndex].name} は ${players[target].name} に ${giveCard.name} を差し押さえで渡しました。`,
            ],
        };

        // 勝利/脱落判定
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
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}
