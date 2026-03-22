// src/DebugControls.tsx
import React from 'react';
import type { CardDefinition } from './cards';

type Props = {
  cards: CardDefinition[];
  handLength: number;
  deck: CardDefinition[];
  onDebugDraw: (cardNo: number) => void;
};

export function DebugControls({ cards, handLength, deck, onDebugDraw }: Props) {
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
    </div>
  );
}