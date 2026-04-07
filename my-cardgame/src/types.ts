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
  | { kind: 'merchant'; player: number; cards: CardDefinition[] }
  | { kind: 'fortune'; player: number; cards: CardDefinition[] }
  | {
    kind: 'noTargetWarning';
    player: number;
    cardNo: number;
  }
  | {
    kind: 'thief';
    player: number;
    step: 'chooseTarget';
  }

  | {
    kind: 'magician';
    player: number;
    step:
    | 'chooseTarget'        // 対象プレイヤー選択
    | 'chooseSelfCard'      // 自分のカード選択
    | 'chooseOpponentCard'  // 相手のカード選択（CPU or Player）
    | 'swap';               // 交換処理
    target?: number;          // 対象プレイヤー
    selfCardIndex?: number;   // 自分が選んだカード
    opponentCardIndex?: number; // 相手が選んだカード
  }

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