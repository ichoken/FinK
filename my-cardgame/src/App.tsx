import { useState } from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards, type CardDefinition } from './cards';
import { createDefaultPlayers, type PlayerInfo, PLAYER_COUNT, HUMAN_PLAYER_INDEX } from './gameConfig';
import { HandView } from './HandView';
import { Header } from './Header';
import { LogView } from './LogView';
import { DebugControls } from './DebugControls';
import { DiscardView } from './DiscardView';
import { DeckView } from './DeckView';
import { PlayerListView } from './PlayerListView';
import { MainLayout } from './MainLayout';
import { BottomLogArea } from './BottomLogArea';
import { useMerchant } from './effects/merchant';
import type { GameState, PendingAction } from './types';


type Screen = 'title' | 'game';

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
  const [players] = useState<PlayerInfo[]>(() => createDefaultPlayers());
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const hands: CardDefinition[][] = Array.from({ length: PLAYER_COUNT }, () => []);
    // 各プレイヤーに2枚ずつ配る（プレイヤー順に配布）
    for (let p = 0; p < PLAYER_COUNT; p += 1) {
      for (let i = 0; i < 2; i += 1) {
        const card = deck.shift();
        if (card) hands[p].push(card);
      }
    }
    return {
      deck,
      hands,
      discard: [],
      log: ['ゲーム開始前の状態です。'],
    };
  });

  const startGame = () => {
    setGameState(() => {
      const deck = buildInitialDeck();
      const hands: CardDefinition[][] = Array.from({ length: PLAYER_COUNT }, () => []);
      for (let p = 0; p < PLAYER_COUNT; p += 1) {
        for (let i = 0; i < 2; i += 1) {
          const card = deck.shift();
          if (card) hands[p].push(card);
        }
      }
      return {
        deck,
        hands,
        discard: [],
        log: ['新しいゲームを開始しました。各プレイヤーに初期手札を2枚配りました。'],
      };
    });
    setScreen('game');
    setActivePlayerIndex(0);
    setSelectedIndex(null);
  };

  const handleSelect = (index: number) => {
    if (pendingAction?.kind === 'merchant') {
      resolveMerchant(index);
      return;
    }

    // 通常のカード選択
    setSelectedIndex(index);
  };

  const resolveMerchant = (index: number) => {
    if (!pendingAction || pendingAction.kind !== 'merchant') return;

    const p = pendingAction.player;

    setGameState((prev) => {
      const nextHands = prev.hands.map((h) => [...h]);
      const [chosen] = nextHands[p].splice(index, 1);

      return {
        deck: [chosen, ...prev.deck],
        hands: nextHands,
        discard: prev.discard,
        log: [
          ...prev.log,
          `${players[p].name} は商人の効果で ${chosen.name} を山札の一番上に戻しました。`,
        ],
      };
    });

    setPendingAction(null);
    setSelectedIndex(null);

    // 次のプレイヤーへ
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
  };

  const confirmUseSelected = () => {
    if (selectedIndex === null) return;
    const card = gameState.hands[activePlayerIndex][selectedIndex];
    if (!card) return;

    if (card.no === 2) {
      const { nextState, pending, endTurn } = useMerchant(
        gameState,
        activePlayerIndex,
        selectedIndex,
        players
      );

      setGameState(nextState);
      setSelectedIndex(null);
      setPendingAction(pending);

      if (endTurn) {
        setActivePlayerIndex((prev) => (prev + 1) % players.length);
      }

      return;
    }

    // 他のカードは playFromHand を呼ぶ
    playFromHand(selectedIndex);
  };

  const drawOne = () => {
    setGameState((prev) => {
      if (prev.deck.length === 0 || prev.hands[activePlayerIndex].length >= 4) {
        return prev;
      }
      const [top, ...rest] = prev.deck;
      const nextHands = prev.hands.map((h) => [...h]);
      nextHands[activePlayerIndex] = [...nextHands[activePlayerIndex], top];
      return {
        deck: rest,
        hands: nextHands,
        discard: prev.discard,
        log: [...prev.log, `プレイヤー${players[activePlayerIndex].name}がカードを1枚ドローしました。（${top.name}）`],
      };
    });
  };


  const debugDrawSpecific = (cardNo: number) => {
    setGameState((prev) => {
      if (prev.hands[activePlayerIndex].length >= 4) return prev;
      const indexInDeck = prev.deck.findIndex((c) => c.no === cardNo);
      if (indexInDeck === -1) return prev;
      const nextDeck = [...prev.deck];
      const [picked] = nextDeck.splice(indexInDeck, 1);
      const nextHands = prev.hands.map((h) => [...h]);
      nextHands[activePlayerIndex] = [...nextHands[activePlayerIndex], picked];
      return {
        deck: nextDeck,
        hands: nextHands,
        discard: prev.discard,
        log: [...prev.log, `デバッグ: ${players[activePlayerIndex].name} に No.${picked.no} ${picked.name} を追加しました。`],
      };
    });
  };


  const playFromHand = (index: number) => {
    setGameState((prev) => {
      const playerHand = prev.hands[activePlayerIndex];
      if (index < 0 || index >= playerHand.length) return prev;
      const nextHands = prev.hands.map((h) => [...h]);
      const [played] = nextHands[activePlayerIndex].splice(index, 1);
      return {
        deck: prev.deck,
        hands: nextHands,
        discard: [...prev.discard, played],
        log: [...prev.log, `${players[activePlayerIndex].name} がカードを使用しました。（${played.name}）`],
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
        <Header
          players={players}
          activePlayerIndex={activePlayerIndex}
          onBackToTitle={() => setScreen('title')}
        />

        {/* MainLayout を縦方向に伸ばすための親コンテナ */}
        <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
          <MainLayout>
            {/* Left column */}
            <div>
              <DeckView deck={gameState.deck} />
              <DiscardView
                discard={gameState.discard}
                lastDiscard={
                  gameState.discard.length > 0 ? gameState.discard[gameState.discard.length - 1] : null
                }
              />
              <PlayerListView
                players={players}
                activePlayerIndex={activePlayerIndex}
                hands={gameState.hands}
              />
            </div>

            {/* Center column */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <HandView
                hand={gameState.hands[activePlayerIndex]}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
                onDraw={drawOne}
                selectMode={pendingAction?.kind ?? null}
                selectableIndexes={
                  pendingAction?.kind === 'merchant'
                    ? gameState.hands[activePlayerIndex].map((_, i) => i)
                    : []
                }
              />

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

              {/* ActionButtons 等があればここに追加 */}
            </div>

            {/* Right column */}
            <div>
              <DebugControls
                cards={cards}
                handLength={gameState.hands[activePlayerIndex].length}
                deck={gameState.deck}
                onDebugDraw={debugDrawSpecific}
                onNextPlayer={() => {
                  setActivePlayerIndex((prev) => (prev + 1) % players.length);
                  setSelectedIndex(null);
                }}
              />
            </div>
          </MainLayout>
        </div>

        {/* 下部ログ（固定高さ） */}
        <BottomLogArea>
          <LogView log={gameState.log} onClear={() => setGameState((prev) => ({ ...prev, log: [] }))} />
        </BottomLogArea>

        {/* モーダルはルート直下に置く（position: fixed を使っているのでここでOK） */}
        {selectedIndex !== null && gameState.hands[activePlayerIndex][selectedIndex] && (
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
                {gameState.hands[activePlayerIndex][selectedIndex].name}
              </h2>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                }}
              >
                効果: {gameState.hands[activePlayerIndex][selectedIndex].effectSummary}
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
                    background: 'linear-gradient(135deg, #f97316, #fb923c, #fed7aa)',
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