// src/effects/magicianHandler.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { trySisterDefense } from '../utils/sisterDefense';
import { discardUsedCard } from '../utils/discardUsedCard';
import { checkHandChangeCombined } from '../utils/checkHandChangeCombined';
import { eliminatePlayerAndUpdate } from '../eliminationHandlers';
import { handleGameOver } from '../victoryHandlers';

type MagicianArgs = {
    pendingAction: PendingAction | null;
    activePlayerIndex: number;
    players: PlayerInfo[];
    gameState: GameState;
    setGameState: (fn: (prev: GameState) => GameState) => void;
    setPendingAction: (p: PendingAction | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setPlayers: (fn: (prev: PlayerInfo[]) => PlayerInfo[]) => void;
};

// --------------------------------------
// Step1: 対象選択後（resolveMagicianTarget）
// --------------------------------------
export function resolveMagicianTargetHandler(
    targetIndex: number,
    args: MagicianArgs
) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'magician') return;

    // 使用カード破棄
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 3));

    // ログ
    setGameState(prev => ({
        ...prev,
        log: [
            ...prev.log,
            `${players[activePlayerIndex].name} が ${players[targetIndex].name} に対して手品師を発動しました。`,
        ],
    }));

    // 手札0チェック
    if (gameState.hands[targetIndex].length === 0 ||
        gameState.hands[activePlayerIndex].length === 0) {
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // シスター防御
    const defended = trySisterDefense(
        targetIndex,
        gameState,
        players,
        setGameState,
        () => {
            setGameState(prev => discardUsedCard(prev, activePlayerIndex, 3));
        }
    );

    if (defended) {
        setPendingAction(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
        return;
    }

    // 自分のカード選択へ
    setPendingAction({
        kind: 'magician',
        player: activePlayerIndex,
        step: 'chooseSelfCard',
        target: targetIndex,
    });
}

// --------------------------------------
// Step2: 自分のカード選択（chooseMagicianSelfCard）
// --------------------------------------
export function chooseMagicianSelfCardHandler(
    selfCardIndex: number,
    args: MagicianArgs
) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'magician') return;

    setGameState(prev => ({
        ...prev,
        log: [
            ...prev.log,
            `${players[activePlayerIndex].name} は「${gameState.hands[activePlayerIndex][selfCardIndex].name}」を交換候補として選択しました。`,
        ],
    }));

    setPendingAction({
        kind: 'magician',
        player: activePlayerIndex,
        step: 'chooseOpponentCard',
        target: pendingAction.target,
        selfCardIndex,
    });
}

// --------------------------------------
// Step3: CPU の相手カード選択（chooseMagicianOpponentCardAuto）
// --------------------------------------
export function chooseMagicianOpponentCardAutoHandler(args: MagicianArgs) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'magician') return;

    const target = pendingAction.target!;
    const opponentHand = gameState.hands[target];
    const chosen = Math.floor(Math.random() * opponentHand.length);

    setGameState(prev => ({
        ...prev,
        log: [
            ...prev.log,
            `${players[target].name}（CPU）は「${opponentHand[chosen].name}」を交換候補として選択しました。`,
        ],
    }));

    setPendingAction({
        kind: 'magician',
        player: activePlayerIndex,
        step: 'swap',
        target,
        selfCardIndex: pendingAction.selfCardIndex,
        opponentCardIndex: chosen,
    });
}

// --------------------------------------
// Step4: 人間の相手カード選択（chooseMagicianOpponentCard）
// --------------------------------------
export function chooseMagicianOpponentCardHandler(
    opponentCardIndex: number,
    args: MagicianArgs
) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'magician') return;

    const target = pendingAction.target!;

    setGameState(prev => ({
        ...prev,
        log: [
            ...prev.log,
            `${players[target].name} は「${gameState.hands[target][opponentCardIndex].name}」を交換候補として選択しました。`,
        ],
    }));

    setPendingAction({
        kind: 'magician',
        player: activePlayerIndex,
        step: 'swap',
        target,
        selfCardIndex: pendingAction.selfCardIndex,
        opponentCardIndex,
    });
}

// --------------------------------------
// Step5: 交換処理（resolveMagicianSwap）
// --------------------------------------
export function resolveMagicianSwapHandler(args: MagicianArgs) {
    const {
        pendingAction,
        activePlayerIndex,
        players,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
    } = args;

    if (!pendingAction || pendingAction.kind !== 'magician') return;

    const target = pendingAction.target!;
    const selfIdx = pendingAction.selfCardIndex!;
    const oppIdx = pendingAction.opponentCardIndex!;

    setGameState(prev => {
        const nextHands = prev.hands.map(h => [...h]);

        const selfCard = nextHands[activePlayerIndex][selfIdx];
        const oppCard = nextHands[target][oppIdx];

        nextHands[activePlayerIndex][selfIdx] = oppCard;
        nextHands[target][oppIdx] = selfCard;

        const updated: GameState = {
            ...prev,
            hands: nextHands,
            log: [
                ...prev.log,
                `${players[activePlayerIndex].name} と ${players[target].name} は「${selfCard.name}」と「${oppCard.name}」を交換しました。`,
            ],
        };

        const result = checkHandChangeCombined(updated, players);

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

        return updated;
    });

    setPendingAction(null);
    setActivePlayerIndex(prev => (prev + 1) % players.length);
}