// src/DiscardView.tsx
import React from 'react';
import type { CardDefinition } from './cards';

type Props = {
  discard: CardDefinition[];
  lastDiscard: CardDefinition | null;
};

export function DiscardView({ discard, lastDiscard }: Props) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        fontSize: '0.9rem',
      }}
    >
      捨て札: {discard.length} 枚
      {lastDiscard && (
        <span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
          （最後に使用: {lastDiscard.name}）
        </span>
      )}
    </div>
  );
}