// src/utils/forcedEffect.ts
import type { GameState, PendingAction } from '../types';
import type { PlayerInfo } from '../gameConfig';
import { discardUsedCard } from '../utils/discardUsedCard';

export type ForcedEffectResult = {
  state: GameState;
  pending: PendingAction | null;
};

export function applyForcedEffect(
  gameState: GameState,
  activePlayerIndex: number,
  players: PlayerInfo[],
): ForcedEffectResult {
  const drawnCard = gameState.hands[activePlayerIndex].slice(-1)[0];
  if (!drawnCard) return { state: gameState, pending: null };

  switch (drawnCard.no) {
    case 10: {
      const next = discardUsedCard(gameState, activePlayerIndex, 10);
      return {
        state: {
          ...next,
          log: [
            ...next.log,
            `${players[activePlayerIndex].name} は差し押さえ（強制発動）を発動しました。`,
          ],
        },
        pending: {
          kind: 'seizure',
          player: activePlayerIndex,
          step: 'chooseTarget',
        },
      };
    }
    case 11: {
      const next = discardUsedCard(gameState, activePlayerIndex, 11);
      if (players[activePlayerIndex].kind === 'human') {
        return {
          state: {
            ...next,
            log: [
              ...next.log,
              `${players[activePlayerIndex].name} の手札が公開されました。`,
            ],
          },
          pending: null,
        };
      }
      return {
        state: {
          ...next,
          log: [
            ...next.log,
            `${players[activePlayerIndex].name} の手札が公開されました。`,
          ],
        },
        pending: {
          kind: 'confusion',
          player: activePlayerIndex,
        },
      };
    }
    default:
      return { state: gameState, pending: null };
  }
}
