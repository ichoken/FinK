import type { GameState, PlayerInfo, CardDefinition, PendingAction } from '../types';

type MerchantResult = {
  nextState: GameState;
  pending: PendingAction;
  endTurn: boolean;
};

export function useMerchant(
  prev: GameState,
  activePlayer: number,
  selectedIndex: number,
  players: PlayerInfo[]
): MerchantResult {
  const nextHands = prev.hands.map((h) => [...h]);
  const [merchant] = nextHands[activePlayer].splice(selectedIndex, 1);

  const afterDiscardCount = nextHands[activePlayer].length;

  const baseLog = [
    ...prev.log,
    `${players[activePlayer].name} が商人を使用しました。`,
  ];

  // ★ 不発
  if (afterDiscardCount === 0) {
    return {
      nextState: {
        ...prev,
        hands: nextHands,
        discard: [...prev.discard, merchant],
        log: [...baseLog, `商人の効果は手札が0枚のため不発でした。`],
      },
      pending: null,
      endTurn: true,
    };
  }

  // ★ 成功 → 選択フェーズへ
  return {
    nextState: {
      ...prev,
      hands: nextHands,
      discard: [...prev.discard, merchant],
      log: baseLog,
    },
    pending: { kind: 'merchant', player: activePlayer }, // ← ここがリテラル型として扱われる
    endTurn: false,
  };
}

