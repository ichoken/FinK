// src/types.ts

import type { CardDefinition } from './cards';
import type { PlayerInfo } from './gameConfig';

export type Screen = 'title' | 'game';

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
  // 商人
  | {
    kind: 'merchant';
    player: number;
  }

  // 占い師（prophet）
  | {
    kind: 'prophet';
    player: number;
    cards: CardDefinition[];
  }

  // 占い師（fortune）
  | {
    kind: 'fortune';
    player: number;
    step: 'chooseTarget' | 'showHand';
    target?: number;
  }

  // シーフ
  | {
    kind: 'thief';
    player: number;
    step: 'chooseTarget';
  }

  // 手品師
  | {
    kind: 'magician';
    player: number;
    step:
    | 'chooseTarget'
    | 'chooseSelfCard'
    | 'chooseOpponentCard'
    | 'swap';
    target?: number;
    selfCardIndex?: number;
    opponentCardIndex?: number;
  }

  // 催眠術師
  | {
    kind: 'hypnotist';
    player: number;
    step: 'chooseTarget';
    returnTo: number;
  }

  // 対象なし警告
  | {
    kind: 'noTargetWarning';
    player: number;
    cardNo: number;
  }
  | {
    kind: 'angel',
    player: number,
  }
  | {
    kind: 'confusion',
    player: number, // CPU の index
  }
  | { kind: 'seizure'; player: number; step: 'chooseTarget' | 'chooseCard'; target?: number }

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
