// src/DeckView.tsx
import React from 'react';
import type { CardDefinition } from './cards';

type Props = {
  deck: CardDefinition[];
};

export function DeckView({ deck }: Props) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        fontSize: '1rem',
      }}
    >
      山札: {deck.length} 枚
    </div>
  );
}