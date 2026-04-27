export type CardType = 'attack' | 'other' | 'force' | 'draw';

export type CardDefinition = {
  no: number;
  name: string;
  count: number;
  type: CardType;
  effectSummary: string;
  image: string;
}

// 最小限のカードセット（仕様書に基づく）
export const cards: CardDefinition[] = [
  {
    no: 1,
    name: '預言者',
    count: 4,
    type: 'other',
    effectSummary: '山札の上から4枚を見て、任意の順番で戻す。',
    image: "/resource/card/01.jpg"
  },
  {
    no: 2,
    name: '商人',
    count: 2,
    type: 'other',
    effectSummary: '手札から1枚を選び、山札の一番上に戻す。',
    image: "/resource/card/02.jpg"
  },
  {
    no: 3,
    name: '手品師',
    count: 4,
    type: 'attack',
    effectSummary: '指定した相手とカードを1枚ずつ交換する。',
    image: "/resource/card/03.jpg"
  },
  {
    no: 4,
    name: 'シーフ',
    count: 4,
    type: 'attack',
    effectSummary: '指定した相手の手札から1枚を奪う。',
    image: "/resource/card/04.jpg"
  },
  {
    no: 5,
    name: '占い師',
    count: 4,
    type: 'attack',
    effectSummary: '指定した相手の手札をすべて確認する。',
    image: "/resource/card/05.jpg"
  },
  {
    no: 6,
    name: '黒魔術師',
    count: 1,
    type: 'other',
    effectSummary: '自分の手札と山札をすべてシャッフルして新たな山札にする。',
    image: "/resource/card/06.jpg"
  },
  {
    no: 7,
    name: 'シスター',
    count: 4,
    type: 'other',
    effectSummary: '攻撃カードの対象になったとき、その攻撃を無効化しこのカードを破棄する。',
    image: "/resource/card/07.jpg"
  },
  {
    no: 8,
    name: '天使',
    count: 2,
    type: 'other',
    effectSummary: '墓地から任意のカード1枚を選び、発動または手札に加える。',
    image: "/resource/card/08.jpg"
  },
  {
    no: 9,
    name: '催眠術師',
    count: 4,
    type: 'attack',
    effectSummary: '指定した相手の手札から1枚を選び、そのカードを強制的に発動させる。',
    image: "/resource/card/09.jpg"
  },
  {
    no: 10,
    name: '差し押さえ',
    count: 2,
    type: 'force',
    effectSummary: '自分の手札1枚を選び、手札4枚未満の相手1人に譲渡する。',
    image: "/resource/card/10.jpg"
  },
  {
    no: 11,
    name: '混乱',
    count: 2,
    type: 'force',
    effectSummary: '自分の手札をすべて公開する。',
    image: "/resource/card/11.jpg"
  },
  {
    no: 12,
    name: 'FinK',
    count: 1,
    type: 'other',
    effectSummary: '使用すると自分は敗北。山札0枚時に所持していると勝利する。',
    image: "/resource/card/12.jpg"
  },
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