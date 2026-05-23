import cardBackImage from '/resource/card/00.jpg';
import type { PlayerInfo } from '../gameConfig';

const CARD_W = 72;
const CARD_H = 107;
const GAP = 8;

type Props = {
  player: PlayerInfo;
  handCount: number;
  isActive: boolean;
  align?: 'left' | 'center' | 'right';
};

export function OpponentHandView({
  player,
  handCount,
  isActive,
  align = 'center',
}: Props) {
  const justifyContent =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems:
          align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        gap: '0.35rem',
        opacity: player.isEliminated ? 0.45 : 1,
      }}
    >
      <div
        style={{
          fontSize: '0.9rem',
          fontWeight: isActive ? 700 : 500,
          padding: '0.2rem 0.5rem',
          borderRadius: 6,
          background: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
        }}
      >
        {player.name}
        {player.isEliminated && '（脱落）'}
        {isActive && ' — 手番'}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: GAP,
          justifyContent,
          minHeight: CARD_H,
        }}
      >
        {handCount === 0 ? (
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>手札なし</span>
        ) : (
          Array.from({ length: handCount }, (_, i) => (
            <img
              key={i}
              src={cardBackImage}
              alt=""
              style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                objectFit: 'cover',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
