import type { GameState } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { checkVictoryOnDeckEmpty } from '../victoryCheck';

/** 山札が空になったときの勝利判定を state に反映 */
export function applyDeckEmptyVictory(
  state: GameState,
  players: PlayerInfo[],
): GameState {
  if (state.deck.length > 0 || state.gameOver) return state;

  const result = checkVictoryOnDeckEmpty(state, players);
  if (!result.win) return state;

  const winnerLabel =
    result.winners.length === 0
      ? '引き分け'
      : result.winners.map((i) => players[i].name).join('、');

  return {
    ...state,
    gameOver: true,
    winners: result.winners,
    log: [...state.log, `山札がなくなりました。勝者: ${winnerLabel}`],
  };
}
