import type { CardDefinition } from './cards';

interface CardViewProps {
  card: CardDefinition;
  onClick?: () => void;
  highlight?: boolean;
}

export function CardView({ card, onClick, highlight = false }: CardViewProps) {
  const isAttack = card.type === 'attack';
  const isDraw = card.type === 'draw';

  const forced =
    card.type === 'force'
      ? '強制発動: ON'
      : '強制発動: OFF';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={isDraw ? 'ドロー' : card.name}
      style={{
        width: 256,
        height: 384,
        borderRadius: 12,
        border: highlight ? '3px solid #00ff00' : '2px solid transparent',
        background:
          'linear-gradient(145deg, rgba(10, 10, 20, 0.9), rgba(60, 60, 90, 0.9))',
        boxShadow:
          '0 8px 20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.8) inset',
        padding: '12px 14px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transform: onClick ? 'translateY(0)' : undefined,
        transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
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
        <span>{isDraw ? 'ドロー' : isAttack ? '攻撃' : 'その他'}</span>
      </div>

      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        {isDraw ? '+ (Draw)' : card.name}
      </div>

      <div style={{
        flex: '0 0 55%',
        borderRadius: 8,
        marginBottom: 8,
        background: isDraw
          ? 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.6), transparent 40%), rgba(220,240,255,0.2)'
          : 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2), transparent 60%), rgba(0, 0, 0, 0.4)',
      }} />

      {!isDraw && (
        <div style={{ fontSize: '0.7rem', marginBottom: 4, opacity: 0.85 }}>
          {forced}
        </div>
      )}

      <div style={{ fontSize: '0.8rem', lineHeight: 1.4, flex: '1 1 auto', color: isDraw ? '#00334d' : undefined }}>
        {isDraw ? '山札からカードを1枚引きます' : card.effectSummary}
      </div>

    </div>
  );
}

