// src/components/CardMessageOverlay.tsx
import type { CardDefinition } from '../cards';

export type CardMessagePreview = {
    cardNos: number[];   // 最大 4 枚まで想定
    message: string;
};

type Props = {
    preview: CardMessagePreview | null;
    cards: CardDefinition[];
};

export function CardMessageOverlay({ preview, cards }: Props) {
    if (!preview) return null;

    const { cardNos, message } = preview;

    const cardImages = cardNos
        .map((no) => cards.find((c) => c.no === no))
        .filter((c): c is CardDefinition => !!c);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999,
                color: '#fff',
            }}
        >
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {cardImages.map((card) => (
                    <img
                        key={card.no}
                        src={card.image}
                        alt={card.name}
                        style={{
                            width: 120,
                            height: 180,
                            borderRadius: 8,
                            boxShadow: '0 0 16px rgba(0,0,0,0.8)',
                            objectFit: 'cover',
                        }}
                    />
                ))}
            </div>

            <div
                style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 8,
                    fontSize: '1rem',
                }}
            >
                {message}
            </div>
        </div>
    );
}
