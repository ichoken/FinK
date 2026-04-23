// src/DebugControls.tsx
import React from 'react';
import type { CardDefinition } from './cards';
import type { PlayerInfo } from './gameConfig';


type Props = {
  cards: CardDefinition[];
  handLength: number;
  deck: CardDefinition[];
  onDebugDraw: (cardNo: number) => void;
  onNextPlayer?: () => void;
  onDebugEliminate?: () => void;
  players?: PlayerInfo[];
  activePlayerIndex?: number;
};

export function DebugControls({ cards, handLength, deck, onDebugDraw, onNextPlayer, onDebugEliminate, players, activePlayerIndex }: Props) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        fontSize: '0.9rem',
        textAlign: 'left',
      }}
    >
      デバッグ: 任意のカードを手札に追加
      <div
        style={{
          marginTop: '0.4rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        {cards.map((card) => {
          const disabled =
            handLength >= 4 ||
            !deck.some((c) => c.no === card.no);

          return (
            <button
              key={`debug-${card.no}`}
              type="button"
              onClick={() => onDebugDraw(card.no)}
              disabled={disabled}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.5)',
                background: disabled
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '0.3rem 0.6rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {card.no}: {card.name}
            </button>
          );
        })}
      </div>
      <div>次のプレイヤーに手番を移動</div>
      <div style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            if (onNextPlayer) onNextPlayer();
          }}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: 6,
            background: 'linear-gradient(180deg,#fff,#eee)',
            border: '1px solid rgba(0,0,0,0.12)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Next Player
        </button>
      </div>
      <div style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            if (onDebugEliminate) onDebugEliminate();
          }}
          style={{
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Debug: 脱落させる
        </button>

        <div style={{ color: '#fff', fontSize: 12 }}>
          {players && typeof activePlayerIndex === 'number'
            ? `現在: ${players[activePlayerIndex]?.name ?? `Player${activePlayerIndex + 1}`}`
            : 'Debug Controls'}
        </div>
      </div>
    </div>
  );
}