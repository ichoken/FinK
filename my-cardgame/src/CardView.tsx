import type { CardDefinition } from './cards';

interface CardViewProps {
  card: CardDefinition;
}

export function CardView({ card }: CardViewProps) {
  const isAttack = card.type === 'attack';
  const forced =
    card.forcedActivation === 'ON'
      ? '強制発動: ON'
      : card.forcedActivation === 'OFF'
        ? '強制発動: OFF'
        : '強制発動: なし';

  return (
    <div
      style={{
        width: 256,
        height: 384,
        borderRadius: 12,
        border: '2px solid rgba(255, 255, 255, 0.8)',
        background:
          'linear-gradient(145deg, rgba(10, 10, 20, 0.9), rgba(60, 60, 90, 0.9))',
        boxShadow:
          '0 8px 20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.8) inset',
        padding: '12px 14px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span>No.{card.no}</span>
        <span>{isAttack ? '攻撃' : 'その他'}</span>
      </div>

      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          flex: '0 0 55%',
          borderRadius: 8,
          marginBottom: 8,
          background:
            'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2), transparent 60%), rgba(0, 0, 0, 0.4)',
        }}
      />

      <div
        style={{
          fontSize: '0.7rem',
          marginBottom: 4,
          opacity: 0.85,
        }}
      >
        {forced}
      </div>

      <div
        style={{
          fontSize: '0.8rem',
          lineHeight: 1.4,
          flex: '1 1 auto',
        }}
      >
        {card.effectSummary}
      </div>
    </div>
  );
}

