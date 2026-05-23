// HandView.tsx
import { CardView } from './CardView';
import type { CardDefinition } from './cards';

type HandViewProps = {
  hand: CardDefinition[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onDraw: () => void;
  selectMode: 'merchant' | 'magician-self' | null;
  selectableIndexes: number[];
  /** false のときドロー・選択を無効化（CPU手番など） */
  interactive?: boolean;
};

export function HandView({
  hand,
  selectedIndex,
  onSelect,
  onDraw,
  selectMode,
  selectableIndexes,
  interactive = true,
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
          if ((selectMode === 'merchant' || selectMode === 'magician-self') && card.type === 'draw') {
            return false;
          }
          return true;
        })
        .map((card, index) => {
          // ★ 枠を緑にするかどうか
          const highlight = selectableIndexes.includes(index);

          return (
            <CardView
              key={`${card.no}-${index}`}
              card={card}
              onClick={
                interactive
                  ? () => {
                      if (card.type === 'draw') {
                        onDraw();
                      } else {
                        onSelect(index);
                      }
                    }
                  : undefined
              }
              highlight={highlight}
              dimmed={!interactive && card.type !== 'draw'}
            />
          );
        })}
    </div>
  );
}