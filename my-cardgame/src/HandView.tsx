// HandView.tsx
import { CardView } from './CardView';
import type { CardDefinition } from './cards';

type HandViewProps = {
  hand: CardDefinition[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onDraw: () => void;
};

export function HandView({ hand, selectedIndex, onSelect , onDraw}: HandViewProps) {
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
      {displayHand.map((card, index) => (
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
        />
      ))}
    </div>
  );
}