import type { CardDefinition } from './cards';
import drawImg from "/resource/card/00.jpg";

interface CardViewProps {
  card: CardDefinition;
  onClick?: () => void;
  highlight?: boolean;
  isDragging?: boolean;
}

export function CardView({ card, onClick, highlight = false, isDragging = false }: CardViewProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={card.name}
      style={{
        width: 180,
        height: 269,
        borderRadius: 12,
        border: highlight ? '3px solid #00ff00' : '2px solid transparent',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.8)',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      }}
    >
      {/* ★ カード画像（全面） */}
      <img
        src={card.no == -1 ? drawImg : card.image}
        alt={card.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* ★ No と名前（画像の上に重ねる） */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          padding: '4px 5px',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>No.{card.no} : {card.name}</span>
      </div>
    </div>
  );
}
