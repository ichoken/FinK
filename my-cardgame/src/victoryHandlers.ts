// src/victoryHandlers.ts
import type { GameState } from './types';
import type { PlayerInfo } from './gameConfig';

export function handleGameOver(params: {
    winners: number[];
    players: PlayerInfo[];
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}) {
    const { winners, players, setGameState } = params;

    // 勝者名を作成
    const winnerNames =
        winners.length === 0
            ? '引き分け'
            : winners.map((idx) => players[idx].name).join('、');

    // gameState を更新
    setGameState((prev) => {
        return {
            ...prev,
            gameOver: true,
            winners,
            log: [...prev.log, `ゲーム終了！勝者: ${winnerNames}`],
        };
    });
}