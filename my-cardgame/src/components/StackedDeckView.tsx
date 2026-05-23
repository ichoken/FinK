import cardBackImage from '/resource/card/00.jpg';

const CARD_W = 120;
const CARD_H = 179;
const MAX_VISIBLE = 12;
const STACK_OFFSET = 3;

type Props = {
  deckCount: number;
};

export function StackedDeckView({ deckCount }: Props) {
  const visibleCount = Math.min(deckCount, MAX_VISIBLE);

  if (deckCount === 0) {
    return (
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 10,
          border: '2px dashed rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          opacity: 0.7,
        }}
      >
        山札なし
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: CARD_W + (visibleCount - 1) * STACK_OFFSET,
        height: CARD_H + (visibleCount - 1) * STACK_OFFSET,
      }}
      aria-label={`山札 ${deckCount}枚`}
    >
      {Array.from({ length: visibleCount }, (_, i) => (
        <img
          key={i}
          src={cardBackImage}
          alt=""
          style={{
            position: 'absolute',
            left: i * STACK_OFFSET,
            top: i * STACK_OFFSET,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 10,
            boxShadow: '0 6px 16px rgba(0,0,0,0.75)',
            objectFit: 'cover',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          right: -8,
          bottom: -8,
          background: 'rgba(0,0,0,0.75)',
          color: '#fff',
          borderRadius: 999,
          padding: '2px 8px',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}
      >
        {deckCount}
      </div>
    </div>
  );
}
