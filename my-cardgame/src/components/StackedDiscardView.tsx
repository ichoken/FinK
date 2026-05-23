import type { CardDefinition } from '../cards';

const CARD_W = 100;
const CARD_H = 149;
const STACK_OFFSET = 14;

type Props = {
  discard: CardDefinition[];
};

export function StackedDiscardView({ discard }: Props) {
  if (discard.length === 0) {
    return (
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 10,
          border: '2px dashed rgba(255,255,255,0.25)',
          opacity: 0.5,
        }}
      />
    );
  }

  const width = CARD_W + (discard.length - 1) * STACK_OFFSET;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height: CARD_H,
      }}
      aria-label={`捨て札 ${discard.length}枚`}
    >
      {discard.map((card, i) => (
        <img
          key={`${card.no}-${i}`}
          src={card.image}
          alt={card.name}
          style={{
            position: 'absolute',
            left: i * STACK_OFFSET,
            top: 0,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 10,
            boxShadow: '0 6px 16px rgba(0,0,0,0.75)',
            objectFit: 'cover',
            zIndex: i,
          }}
        />
      ))}
    </div>
  );
}
