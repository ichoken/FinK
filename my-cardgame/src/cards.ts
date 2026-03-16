// src/cards.ts
// カード定義ファイル（全文）
// App.tsx などから import { cards, type CardDefinition } from './cards' で利用します。

export type ForceType = 'ON' | 'OFF' | 'NONE';

export type CardDefinition = {
  no: number;
  name: string;
  count: number;
  force: ForceType;
  type: '攻撃' | 'その他';
  // 必要なら追加フィールド（説明など）
  description?: string;
};

// 最小限のカードセット（仕様書に基づく）
export const cards: CardDefinition[] = [
  { no: 1, name: '預言者', count: 4, force: 'OFF', type: 'その他', description: '山札の上から4枚確認して順番を戻す' },
  { no: 2, name: '商人', count: 2, force: 'OFF', type: 'その他', description: '手札1枚を山札の一番上に戻す' },
  { no: 3, name: '手品師', count: 4, force: 'OFF', type: '攻撃', description: '指定相手とカードを入れ替える' },
  { no: 4, name: 'シーフ', count: 4, force: 'OFF', type: '攻撃', description: '指定相手のカードを1枚奪う' },
  { no: 5, name: '占い師', count: 4, force: 'OFF', type: '攻撃', description: '指定相手の手札をすべて確認する' },
  { no: 6, name: '黒魔術師', count: 1, force: 'OFF', type: 'その他', description: '手札と山札をすべてシャッフルして山札に戻す' },
  { no: 7, name: 'シスター', count: 4, force: 'OFF', type: 'その他', description: '攻撃の対象になったときに1枚無効化して墓地へ' },
  { no: 8, name: '天使', count: 2, force: 'OFF', type: 'その他', description: '墓地からカードを手札に加える' },
  { no: 9, name: '催眠術師', count: 4, force: 'OFF', type: '攻撃', description: '指定相手のカードを1枚発動させる' },
  { no: 10, name: '差し押さえ', count: 2, force: 'ON', type: 'その他', description: '手札の任意のカードを任意の相手に譲渡する（強制発動）' },
  { no: 11, name: '混乱', count: 2, force: 'ON', type: 'その他', description: '自分の手札を全員に公開する（強制発動）' },
  { no: 12, name: 'FinK', count: 1, force: 'NONE', type: 'その他', description: '使用したプレイヤーは脱落する。山札0で所持していると勝利' },
];

export function buildInitialDeck(): CardDefinition[] {
  const deck: CardDefinition[] = [];
  cards.forEach((card) => {
    for (let i = 0; i < card.count; i += 1) {
      deck.push(card);
    }
  });

  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}