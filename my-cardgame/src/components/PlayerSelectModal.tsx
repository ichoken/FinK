import React from 'react';
import { Modal } from './Modal';
import type { PlayerInfo } from '../gameConfig';

type PlayerWithIndex = PlayerInfo & { index: number };

interface PlayerSelectModalProps {
    players: PlayerWithIndex[];        // 表示するプレイヤー（index 付き・フィルタ済み）
    onSelect: (playerIndex: number) => void;
    title?: string;
}

export function PlayerSelectModal({ players, onSelect, title }: PlayerSelectModalProps) {
    return (
        <Modal title={title}>
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}
            >
                {players.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.index)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.4)',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            cursor: 'pointer',
                            minWidth: '120px',
                            fontSize: '1rem',
                        }}
                    >
                        {p.name}
                    </button>
                ))}
            </div>
        </Modal>
    );
}