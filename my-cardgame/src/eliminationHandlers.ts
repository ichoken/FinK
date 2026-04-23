// src/eliminationHandlers.ts
import type { GameState } from './types';
import type { PlayerInfo } from './gameConfig';
import { checkVictoryOnElimination } from './victoryCheck';
import { handleGameOver } from './victoryHandlers';
import { checkElimination } from './eliminationCheck';

/** Fisher‑Yates シャッフル（ユーティリティ） */
export function shuffleArray<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * 純粋関数: 脱落処理を行い新しい GameState を返す
 * - playerIndex の手札を山札と結合してシャッフルして山札に戻す
 * - 脱落者の手札は空にする
 * - ログに脱落エントリを追加する
 * - players の isEliminated 更新は行わない（呼び出し側で setPlayers を行う）
 */
export function eliminatePlayerPure(playerIndex: number, state: GameState, players: PlayerInfo[]): GameState {
    const playerName = players[playerIndex]?.name ?? `Player${playerIndex + 1}`;
    const eliminatedHand = state.hands[playerIndex] ?? [];

    // 仕様: 脱落者の手札と残りの山札を結合してシャッフルして山札に戻す
    const cardsToShuffleBack = [...eliminatedHand, ...state.deck];
    const newDeck = shuffleArray(cardsToShuffleBack);

    const newHands = state.hands.map((h, i) => (i === playerIndex ? [] : h));
    const newLog = [...state.log, `${playerName} は脱落しました。脱落要因の提示を行ってください。`];

    return {
        ...state,
        deck: newDeck,
        hands: newHands,
        log: newLog,
    };
}

/**
 * 副作用ハンドラ: React の setState / setPlayers を受け取り脱落処理を実行する
 * - setGameState: React の setState 関数 (updater 形式)
 * - setPlayers: React の setPlayers 関数
 * - players: 現在の players 配列（最新の値を渡すこと）
 * - onShowEliminationModal: optional 脱落要因提示用コールバック (playerIndex, eliminatedHand)
 *
 * 呼び出し例:
 *   eliminatePlayerAndUpdate({
 *     playerIndex: idx,
 *     players,
 *     setPlayers,
 *     setGameState,
 *     onShowEliminationModal: (idx, hand) => { ... }
 *   });
 */
export function eliminatePlayerAndUpdate(params: {
    playerIndex: number;
    players: PlayerInfo[];
    setPlayers: React.Dispatch<React.SetStateAction<PlayerInfo[]>>;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    onShowEliminationModal?: (playerIndex: number, eliminatedHand: readonly any[]) => void;
}) {
    const { playerIndex, players, setPlayers, setGameState, onShowEliminationModal } = params;

    // 1) gameState を updater で更新して脱落者の手札を山札に戻す
    // 1) gameState を updater で更新して脱落者の手札を山札に戻す
    setGameState((prev) => {
        const eliminatedHand = prev.hands[playerIndex] ?? [];

        // UI に脱落要因を提示したい場合はコールバックで渡す
        if (onShowEliminationModal) {
            try {
                onShowEliminationModal(playerIndex, eliminatedHand);
            } catch (e) {
                // モーダル表示で例外が出ても処理は続ける
            }
        }

        const cardsToShuffleBack = [...eliminatedHand, ...prev.deck];
        const newDeck = shuffleArray(cardsToShuffleBack);

        const newHands = prev.hands.map((h, i) => (i === playerIndex ? [] : h));

        // ★ 脱落理由を取得
        const eliminationInfo = checkElimination(playerIndex, prev);

        // ★ 脱落理由をログに追加
        const newLog = [
            ...prev.log,
            `${players[playerIndex]?.name ?? `Player${playerIndex + 1}`} は脱落しました。`,
            eliminationInfo.reason ? `（理由：${eliminationInfo.reason}）` : '',
        ];

        return {
            ...prev,
            deck: newDeck,
            hands: newHands,
            log: newLog,
        };
    });

    // 2) players の isEliminated を更新
    setPlayers((prev) => {
        const next = prev.map((p, i) =>
            i === playerIndex ? { ...p, isEliminated: true } : p
        );

        // ★★★ ここで勝利判定（生存者1名）を行う ★★★
        const v = checkVictoryOnElimination(next);
        if (v.win) {
            handleGameOver({
                winners: v.winners,
                players: next,
                setGameState,
            });

            // gameState に勝利ログを追加
            setGameState((prevState) => ({
                ...prevState,
                log: [...prevState.log, `勝利条件達成: 生存者1名`],
            }));
        }

        return next;
    });

}