// src/types.ts
// GameState と PlayerState の型定義（全文）

import type { CardDefinition } from './cards';

export type PlayerKind = 'human' | 'cpu';

export type PlayerState = {
  id: number;
  name: string;
  kind: PlayerKind;
  hand: CardDefinition[];
  isEliminated: boolean;
};

export type GameState = {
  deck: CardDefinition[];
  discard: CardDefinition[];
  players: PlayerState[];
  log: string[];
  activePlayerIndex: number;
};