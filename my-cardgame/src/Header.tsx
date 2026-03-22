// src/Header.tsx
import React from 'react';
import titleImage from '../resource/title.jpg';

type Player = {
  name: string;
  kind: 'human' | 'cpu';
};

type Props = {
  players: Player[];
  activePlayerIndex: number;
  onBackToTitle: () => void;
};

export function Header({ players, activePlayerIndex, onBackToTitle }: Props) {
  const active = players[activePlayerIndex];

  return (
    <header
      style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'transparent',
      }}
    >
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>FinK</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', opacity: 0.9 }}>
          現在の手番: {active?.name} {active?.kind === 'human' ? '(あなた)' : '(CPU)'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBackToTitle}
          style={{
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.6)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '0.4rem 0.9rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Back to title
        </button>
      </div>
    </header>
  );
}