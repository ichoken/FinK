import { useState } from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards, type CardDefinition } from './cards';
import { CardView } from './CardView';

type Screen = 'title' | 'game';

type GameState = {
  deck: CardDefinition[];
  hand: CardDefinition[];
  discard: CardDefinition[];
};

function buildInitialDeck(): CardDefinition[] {
  const deck: CardDefinition[] = [];

  cards.forEach((card) => {
    for (let i = 0; i < card.count; i += 1) {
      deck.push(card);
    }
  });

  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const hand = deck.splice(0, 2);
    return { deck, hand, discard: [] };
  });

  const startGame = () => {
    setGameState(() => {
      const deck = buildInitialDeck();
      const hand = deck.splice(0, 2);
      return { deck, hand, discard: [] };
    });
    setScreen('game');
  };

  const drawOne = () => {
    setGameState((prev) => {
      if (prev.deck.length === 0 || prev.hand.length >= 4) {
        return prev;
      }

      const [top, ...rest] = prev.deck;
      return {
        deck: rest,
        hand: [...prev.hand, top],
        discard: prev.discard,
      };
    });
  };

  const playFromHand = (index: number) => {
    setGameState((prev) => {
      if (index < 0 || index >= prev.hand.length) return prev;
      const nextHand = [...prev.hand];
      const [played] = nextHand.splice(index, 1);
      return {
        deck: prev.deck,
        hand: nextHand,
        discard: [...prev.discard, played],
      };
    });

    setSelectedIndex(null);
  };

  if (screen === 'game') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: `url(${titleImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          textShadow: '0 3px 10px rgba(0, 0, 0, 0.8)',
        }}
      >
        <header
          style={{
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>FinK</div>
          <button
            type="button"
            onClick={() => setScreen('title')}
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
        </header>

        <main
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem 2rem 1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              fontSize: '1rem',
            }}
          >
            <div>山札: {gameState.deck.length} 枚</div>
            <button
              type="button"
              onClick={drawOne}
              disabled={gameState.deck.length === 0 || gameState.hand.length >= 4}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255, 255, 255, 0.7)',
                background:
                  gameState.deck.length === 0 || gameState.hand.length >= 4
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '0.5rem 1.2rem',
                cursor:
                  gameState.deck.length === 0 || gameState.hand.length >= 4
                    ? 'default'
                    : 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Draw
            </button>
          </div>
          <div
            style={{
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            捨て札: {gameState.discard.length} 枚
            {gameState.discard.length > 0 && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
                （最後に使用: {gameState.discard[gameState.discard.length - 1].name}）
              </span>
            )}
          </div>
          <div
            style={{
              marginBottom: '1rem',
              fontSize: '1.1rem',
            }}
          >
            手札（{gameState.hand.length} / 4 枚）
          </div>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
            }}
          >
            {gameState.hand.map((card, index) => (
              <CardView
                // 同名カードもあり得るので index をキーに含める
                key={`${card.no}-${index}`}
                card={card}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
          {selectedIndex !== null && gameState.hand[selectedIndex] && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(10, 10, 25, 0.95)',
                  borderRadius: 16,
                  padding: '1.5rem 2rem',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)',
                  maxWidth: 600,
                  width: '90%',
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: '0.75rem',
                    fontSize: '1.4rem',
                  }}
                >
                  {gameState.hand[selectedIndex].name}
                </h2>
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: '0.5rem',
                    fontSize: '0.95rem',
                  }}
                >
                  効果: {gameState.hand[selectedIndex].effectSummary}
                </p>
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    opacity: 0.9,
                  }}
                >
                  このカードを使用すると、現在は「捨て札に送る」だけの仮実装です。
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    style={{
                      borderRadius: 999,
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: '#fff',
                      padding: '0.45rem 1.1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => playFromHand(selectedIndex)}
                    style={{
                      borderRadius: 999,
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      background:
                        'linear-gradient(135deg, #f97316, #fb923c, #fed7aa)',
                      color: '#000',
                      padding: '0.45rem 1.4rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                    }}
                  >
                    Use this card
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${titleImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#ffffff',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            letterSpacing: '0.2em',
          }}
        >
          FinK
        </h1>
        <button
          type="button"
          onClick={startGame}
          style={{
            border: 'none',
            padding: 0,
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <img
              src={mainBtnImage}
              alt="Game start button"
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                pointerEvents: 'none',
              }}
            >
              Game start
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}