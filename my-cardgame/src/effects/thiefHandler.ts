// src/effects/thiefHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { trySisterDefense } from '../utils/sisterDefense';
import { discardUsedCard } from '../utils/discardUsedCard';

type ResolveThiefArgs = {
    targetIndex: number;
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (updater: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
};

export function resolveThiefTargetHandler({
    targetIndex,
    pendingAction,
    activePlayerIndex,
    players,
    gameState,
    setGameState,
    setPendingAction,
    setActivePlayerIndex,
}: ResolveThiefArgs) {
    if (!pendingAction || pendingAction.kind !== 'thief') return;

    // 使用カード破棄
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 4));

    // シスター防御
    const defended = trySisterDefense(
        targetIndex,
        gameState,
        players,
        setGameState,
        () => {
            setGameState(prev => discardUsedCard(prev, activePlayerIndex, 4));
        }
    );

    if (defended) {
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // 奪う処理
    setGameState(prev => {
        const nextHands = prev.hands.map(h => [...h]);
        const targetHand = nextHands[targetIndex];

        const stolenIdx = Math.floor(Math.random() * targetHand.length);
        const [stolenCard] = targetHand.splice(stolenIdx, 1);

        nextHands[activePlayerIndex].push(stolenCard);

        return {
            ...prev,
            hands: nextHands,
            log: [
                ...prev.log,
                `${players[activePlayerIndex].name} は ${players[targetIndex].name} から ${stolenCard.name} を盗みました。`,
            ],
        };
    });

    // ターン終了
    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}