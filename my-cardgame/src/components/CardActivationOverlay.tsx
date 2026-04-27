import React from 'react';
import type { CardDefinition } from '../types';
import type { PlayerInfo } from '../gameConfig';

export type CardActivationPreview = {
  sourceIndex: number;
  targetIndex?: number;
  card: CardDefinition;
};

type Props = {
  preview: CardActivationPreview | null;
  players: PlayerInfo[];
};

export function CardActivationOverlay({ preview, players }: Props) {
  if (!preview) return null;

  const sourceName = players[preview.sourceIndex]?.name ?? `Player ${preview.sourceIndex}`;
  const targetName =
    preview.targetIndex === undefined
      ? null
      : players[preview.targetIndex]?.name ?? `Player ${preview.targetIndex}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(760px, 92vw)',
          background: 'rgba(10,10,25,0.92)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 16,
          padding: '18px 18px 14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          color: '#fff',
          textShadow: '0 3px 10px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <img
            src={preview.card.image}
            alt={preview.card.name}
            style={{
              width: 112,
              height: 156,
              objectFit: 'cover',
              borderRadius: 10,
              boxShadow: '0 10px 26px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.22)',
              flex: '0 0 auto',
            }}
          />

          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>カード発動</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {preview.card.name}
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <NamePill label={sourceName} />
              <Arrow />
              <NamePill label={targetName ?? '（対象なし）'} dim={targetName === null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NamePill({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        background: dim ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.18)',
        fontWeight: 800,
        letterSpacing: 0.2,
        opacity: dim ? 0.75 : 1,
      }}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: 0.9,
        flex: '0 0 auto',
      }}
    >
      <span style={{ width: 26, height: 2, background: 'rgba(255,255,255,0.65)' }} />
      <span style={{ fontSize: 18, fontWeight: 900 }}>▶</span>
      <span style={{ width: 26, height: 2, background: 'rgba(255,255,255,0.65)' }} />
    </div>
  );
}

