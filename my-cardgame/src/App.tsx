import { useState } from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards, type CardDefinition } from './cards';
import { CardView } from './CardView';

type Screen = 'title' | 'game';

type GameState = {
  deck: CardDefinition[];
  hand: CardDefinition[];
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
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const hand = deck.splice(0, 2);
    return { deck, hand };
  });

  const startGame = () => {
    setGameState(() => {
      const deck = buildInitialDeck();
      const hand = deck.splice(0, 2);
      return { deck, hand };
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
      };
    });
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
            {gameState.hand.map((card) => (
              <CardView key={card.no} card={card} />
            ))}
          </div>
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