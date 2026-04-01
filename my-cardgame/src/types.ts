// src/types.ts

import type { CardDefinition } from './cards';
import type { PlayerInfo } from './gameConfig';

// カード効果の種類（今後追加していく）
export type PendingActionKind =
  | 'merchant'
  | 'prophet'
  | 'thief'
  | 'hypnotist'
  | 'angel'
  | 'seize'
  | 'confusion';

// pendingAction の型
export type PendingAction =
  | { kind: PendingActionKind; player: number }
  | { kind: 'prophet'; player: number; cards: CardDefinition[] }
  | null;

// ゲーム全体の状態
export type GameState = {
  deck: CardDefinition[];
  hands: CardDefinition[][];
  discard: CardDefinition[];
  log: string[];
  gameOver: boolean;
  winners: number[];
};

export type { PlayerInfo, CardDefinition };