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
  log: string[];
};

type PendingAction =
  | { kind: 'merchant' }
  | null;

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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const hand = deck.splice(0, 2);
    return {
      deck,
      hand,
      discard: [],
      log: ['ゲーム開始前の状態です。'],
    };
  });

  const startGame = () => {
    setGameState(() => {
      const deck = buildInitialDeck();
      const hand = deck.splice(0, 2);
      return {
        deck,
        hand,
        discard: [],
        log: ['新しいゲームを開始しました。初期手札を2枚配りました。'],
      };
    });
    setScreen('game');
  };

  const resolveMerchant = (index: number) => {
    setGameState((prev) => {
      if (index < 0 || index >= prev.hand.length) return prev;
      const nextHand = [...prev.hand];
      const [chosen] = nextHand.splice(index, 1);
      return {
        deck: [chosen, ...prev.deck],
        hand: nextHand,
        discard: prev.discard,
        log: [
          ...prev.log,
          `商人の効果でカードを山札の一番上に戻しました。（${chosen.name}）`,
        ],
      };
    });
    setPendingAction(null);
  };

  const confirmUseSelected = () => {
    if (selectedIndex === null) return;
    const card = gameState.hand[selectedIndex];
    if (!card) return;

    if (card.no === 2) {
      // 商人の効果：自身を捨て札に送り、手札から1枚を山札の一番上に戻す
      setGameState((prev) => {
        if (selectedIndex < 0 || selectedIndex >= prev.hand.length) return prev;
        const nextHand = [...prev.hand];
        const [merchant] = nextHand.splice(selectedIndex, 1);
        return {
          deck: prev.deck,
          hand: nextHand,
          discard: [...prev.discard, merchant],
          log: [...prev.log, '商人を使用しました。手札から1枚を山札の上に戻します。'],
        };
      });
      setSelectedIndex(null);
      setPendingAction({ kind: 'merchant' });
      return;
    }

    if (card.no === 6) {
      // 黒魔術師の効果：自分の手札と山札をすべてシャッフルして新たな山札にする
      setGameState((prev) => {
        if (selectedIndex < 0 || selectedIndex >= prev.hand.length) return prev;

        const pool: CardDefinition[] = [...prev.hand, ...prev.deck];

        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        return {
          deck: pool,
          hand: [],
          discard: prev.discard,
          log: [...prev.log, '黒魔術師を使用しました。手札と山札をすべてシャッフルしました。'],
        };
      });

      setSelectedIndex(null);
      return;
    }

    playFromHand(selectedIndex);
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
        log: [...prev.log, `カードを1枚ドローしました。（${top.name}）`],
      };
    });
  };

  const debugDrawSpecific = (cardNo: number) => {
    setGameState((prev) => {
      if (prev.hand.length >= 4) return prev;

      const indexInDeck = prev.deck.findIndex((c) => c.no === cardNo);
      if (indexInDeck === -1) return prev;

      const nextDeck = [...prev.deck];
      const [picked] = nextDeck.splice(indexInDeck, 1);

      return {
        deck: nextDeck,
        hand: [...prev.hand, picked],
        discard: prev.discard,
        log: [
          ...prev.log,
          `デバッグ: 特定のカードを手札に追加しました。（No.${picked.no} ${picked.name}）`,
        ],
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
        log: [...prev.log, `カードを使用しました。（${played.name}）`],
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
              fontSize: '0.85rem',
              opacity: 0.9,
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
              {cards.map((card) => (
                <button
                  key={`debug-${card.no}`}
                  type="button"
                  onClick={() => debugDrawSpecific(card.no)}
                  disabled={
                    gameState.hand.length >= 4 ||
                    !gameState.deck.some((c) => c.no === card.no)
                  }
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    background:
                      gameState.hand.length >= 4 ||
                      !gameState.deck.some((c) => c.no === card.no)
                        ? 'rgba(0, 0, 0, 0.3)'
                        : 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '0.25rem 0.7rem',
                    fontSize: '0.75rem',
                    cursor:
                      gameState.hand.length >= 4 ||
                      !gameState.deck.some((c) => c.no === card.no)
                        ? 'default'
                        : 'pointer',
                  }}
                >
                  {card.no}. {card.name}
                </button>
              ))}
            </div>
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
                onClick={() =>
                  pendingAction?.kind === 'merchant'
                    ? resolveMerchant(index)
                    : setSelectedIndex(index)
                }
              />
            ))}
          </div>
          {pendingAction?.kind === 'merchant' && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.85rem',
                opacity: 0.9,
              }}
            >
              商人の効果発動中: 山札の一番上に戻すカードを手札から1枚選んでください。
            </div>
          )}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 12,
              maxHeight: '25vh',
              overflowY: 'auto',
              fontSize: '0.8rem',
            }}
          >
            <div
              style={{
                marginBottom: '0.4rem',
                fontWeight: 600,
              }}
            >
              ログ
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {gameState.log.map((entry, index) => (
                <li key={`log-${index}`}>{entry}</li>
              ))}
            </ul>
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
                  このカードを使用すると、カードごとの効果（例: 商人は手札1枚を山札の上に戻す／黒魔術師は手札と山札をシャッフル）を順次適用します。
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
                    onClick={confirmUseSelected}
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