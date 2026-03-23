// HandView.tsx
import { CardView } from './CardView';
import type { CardDefinition } from './cards';

type HandViewProps = {
  hand: CardDefinition[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onDraw: () => void;
  selectMode: 'merchant' | 'prophet' | null;
  selectableIndexes: number[];
};

export function HandView({
  hand,
  selectedIndex,
  onSelect,
  onDraw,
  selectMode,
  selectableIndexes,
}: HandViewProps) {
  const displayHand: CardDefinition[] = [...hand];

  displayHand.push({
    no: -1,
    name: '+(Draw)',
    count: 0,
    type: 'draw',
    effectSummary: '',
  });

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
      {displayHand
        .filter((card) => {
          // ★ 選択フェーズではドローカードを非表示にする
          if (selectMode !== null && card.type === 'draw') return false;
          return true;
        })
        .map((card, index) => {
          // ★ 枠を緑にするかどうか
          const highlight = selectableIndexes.includes(index);

          return (
            <CardView
              key={`${card.no}-${index}`}
              card={card}
              onClick={() => {
                if (card.type === 'draw') {
                  onDraw();
                } else {
                  onSelect(index);
                }
              }}
              highlight={highlight} // ← ★ ここに追加
            />
          );
        })}
    </div>
  );
}