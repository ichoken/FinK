// HandView.tsx
import { CardView } from './CardView';
import type { CardDefinition } from './cards';

type HandViewProps = {
  hand: CardDefinition[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

export function HandView({ hand, selectedIndex, onSelect }: HandViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '1.5rem',
      }}
    >
      {hand.map((card, index) => (
        <CardView
          key={`${card.no}-${index}`}
          card={card}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}