// src/effects/thiefHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { trySisterDefense } from '../utils/sisterDefense';
import { discardUsedCard } from '../utils/discardUsedCard';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';
import { advanceToNextPlayer } from '../utils/advanceTurn';

type ResolveThiefArgs = {
    targetIndex: number;
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (updater: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
    onShowCardMessageOverlay?: (cardNos: number[], message: string) => Promise<void>;
};

export async function resolveThiefTargetHandler({
    targetIndex,
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
    setPlayers,
    onShowCardMessageOverlay,
}: ResolveThiefArgs) {
    if (!pendingAction || pendingAction.kind !== 'thief') return;

    const defended = await trySisterDefense(
        targetIndex,
        gameState,
        players,
        setGameState,
        () => {
            setGameState((prev) => discardUsedCard(prev, activePlayerIndex, 4));
        },
        onShowCardMessageOverlay,
    );

    if (defended) {
        setPendingAction(null);
        setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
        return;
    }

    setGameState((prev) => {
        let next = discardUsedCard(prev, activePlayerIndex, 4);
        const nextHands = next.hands.map((h) => [...h]);
        const targetHand = nextHands[targetIndex];

        if (!targetHand || targetHand.length === 0) {
            return next;
        }

        const stolenIdx = Math.floor(Math.random() * targetHand.length);
        const [stolenCard] = targetHand.splice(stolenIdx, 1);
        nextHands[activePlayerIndex].push(stolenCard);

        let updated: GameState = {
            ...next,
            hands: nextHands,
            log: [
                ...next.log,
                `${players[activePlayerIndex].name} は ${players[targetIndex].name} から ${stolenCard.name} を盗みました。`,
            ],
        };

        const result = checkHandChangeCombined(updated, players);
        result.eliminated.forEach((idx) => {
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

        return updated;
    });

    setPendingAction(null);
    setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
}
