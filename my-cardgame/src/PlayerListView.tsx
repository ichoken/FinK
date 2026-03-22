// src/PlayerListView.tsx
import React from 'react';
import type { PlayerInfo } from './gameConfig';
import type { CardDefinition } from './cards';

type Props = {
  players: PlayerInfo[];
  activePlayerIndex: number;
  hands: CardDefinition[][];
};

export function PlayerListView({ players, activePlayerIndex, hands }: Props) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
      }}
    >
      {players.map((p, index) => {
        const isActive = index === activePlayerIndex;
        const handCount = hands[p.id]?.length ?? 0;
        const eliminated = (p as any).isEliminated ?? false;

        return (
          <div
            key={p.id}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: 6,
              background: eliminated
                ? 'rgba(255, 255, 255, 0.15)'
                : isActive
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(0, 0, 0, 0.3)',
              opacity: eliminated ? 0.5 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              {p.name}
              {eliminated && '（脱落）'}
            </span>
            <span>手札 {handCount} 枚</span>
          </div>
        );
      })}
    </div>
  );
}