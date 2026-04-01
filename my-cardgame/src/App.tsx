import { useState } from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards, type CardDefinition } from './cards';
import { createDefaultPlayers, type PlayerInfo, PLAYER_COUNT, HUMAN_PLAYER_INDEX } from './gameConfig';
import { useMerchant } from './effects/merchant';
import { useProphet } from './effects/prophet';
import type { GameState, PendingAction } from './types';
import { eliminatePlayerAndUpdate } from './eliminationHandlers';
import { checkElimination } from './eliminationCheck';
import { handleGameOver } from './victoryHandlers';
import {
  checkVictoryOnHandChange,
  checkVictoryOnElimination,
  checkVictoryOnDeckEmpty,
} from './victoryCheck';
import { GameScreen } from './GameScreen';



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
  const [players, setPlayers] = useState<PlayerInfo[]>(() => createDefaultPlayers());
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
      gameOver: false,
      winners: [],
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
        gameOver: false,
        winners: [],
      };
    });
    setPlayers(() => createDefaultPlayers());
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
  const resolveProphet = () => {
    if (!pendingAction || pendingAction.kind !== 'prophet') return;

    const p = pendingAction.player;
    const ordered = pendingAction.cards;

    setGameState((prev) => {
      return {
        deck: [...ordered, ...prev.deck], // ← 並び替えた順で山札の上に戻す
        hands: prev.hands,
        discard: prev.discard,
        log: [
          ...prev.log,
          `${players[p].name} は預言者の効果で山札の上を並び替えました。`,
        ],
      };
    });

    setPendingAction(null);

    // 次のプレイヤーへ
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
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

    if (card.no === 1) {
      const { nextState, pending, endTurn } = useProphet(
        gameState,
        activePlayerIndex,
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
      // --- 1) 山札チェック ---
      if (prev.deck.length === 0) return prev;

      // --- 2) ドロー処理 ---
      const nextDeck = [...prev.deck];
      const [drawn] = nextDeck.splice(0, 1);

      const nextHands = prev.hands.map((h) => [...h]);
      nextHands[activePlayerIndex] = [...nextHands[activePlayerIndex], drawn];

      let nextState: GameState = {
        ...prev,
        deck: nextDeck,
        hands: nextHands,
        log: [
          ...prev.log,
          `${players[activePlayerIndex].name} がカードを1枚引きました。`,
        ],
      };

      // --- 3) 脱落判定 ---
      const elim = checkElimination(activePlayerIndex, nextState);
      if (elim.eliminated) {
        eliminatePlayerAndUpdate({
          playerIndex: activePlayerIndex,
          players,
          setPlayers,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `脱落理由: ${elim.reason}`],
        };

        return nextState;
      }

      // --- 4) 勝利判定（シスター4枚） ---
      const v1 = checkVictoryOnHandChange(activePlayerIndex, nextState);

      if (v1.win) {
        handleGameOver({
          winners: v1.winners,
          players,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `勝利条件達成: シスター4枚`],
        };

        return nextState;
      }

      // --- 5) 勝利判定（山札0枚 + FinK） ---
      const v2 = checkVictoryOnDeckEmpty(nextState, players);
      if (v2.win) {
        handleGameOver({
          winners: v2.winners,
          players,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `勝利条件達成: 山札0枚 + FinK`],
        };

        return nextState;
      }

      return nextState;
    });
  };


  const debugDrawSpecific = (cardNo: number) => {
    setGameState((prev) => {
      // --- 1) 手札追加処理 ---
      if (prev.hands[activePlayerIndex].length >= 4) return prev;

      const indexInDeck = prev.deck.findIndex((c) => c.no === cardNo);
      if (indexInDeck === -1) return prev;

      const nextDeck = [...prev.deck];
      const [picked] = nextDeck.splice(indexInDeck, 1);

      const nextHands = prev.hands.map((h) => [...h]);
      nextHands[activePlayerIndex] = [...nextHands[activePlayerIndex], picked];

      let nextState: GameState = {
        ...prev,
        deck: nextDeck,
        hands: nextHands,
        log: [
          ...prev.log,
          `デバッグ: ${players[activePlayerIndex].name} に No.${picked.no} ${picked.name} を追加しました。`,
        ],
      };

      // --- 2) 脱落判定 ---
      const elim = checkElimination(activePlayerIndex, nextState);
      if (elim.eliminated) {
        eliminatePlayerAndUpdate({
          playerIndex: activePlayerIndex,
          players,
          setPlayers,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `脱落理由: ${elim.reason}`],
        };

        return nextState;
      }

      // --- 3) 勝利判定（シスター4枚） ---
      const v1 = checkVictoryOnHandChange(activePlayerIndex, nextState);

      if (v1.win) {
        handleGameOver({
          winners: v1.winners,
          players,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `勝利条件達成: シスター4枚`],
        };

        return nextState;
      }

      // --- 4) 勝利判定（山札0枚） ---
      const v2 = checkVictoryOnDeckEmpty(nextState, players);
      if (v2.win) {
        handleGameOver({
          winners: v2.winners,
          players,
          setGameState,
        });

        nextState = {
          ...nextState,
          log: [...nextState.log, `勝利条件達成: 山札0枚 + FinK`],
        };

        return nextState;
      }

      return nextState;
    });
  };


  const debugEliminateActivePlayer = () => {
    // onShowEliminationModal を渡すと UI 側で脱落要因を表示できます
    eliminatePlayerAndUpdate({
      playerIndex: activePlayerIndex,
      players,
      setPlayers,
      setGameState,
      onShowEliminationModal: (idx, eliminatedHand) => {
        // ここでモーダルを開く等の UI 処理を行えます
        // 例: setEliminationModal({ open: true, playerIndex: idx, hand: eliminatedHand });
        // 今はログで確認するだけなら何もしなくて良い
        // console.log('Elimination modal callback', idx, eliminatedHand);
      },
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
      <GameScreen
        players={players}
        gameState={gameState}
        activePlayerIndex={activePlayerIndex}
        selectedIndex={selectedIndex}
        pendingAction={pendingAction}
        handleSelect={handleSelect}
        drawOne={drawOne}
        debugDrawSpecific={debugDrawSpecific}
        debugEliminateActivePlayer={debugEliminateActivePlayer}
        resolveProphet={resolveProphet}
        confirmUseSelected={confirmUseSelected}
        setSelectedIndex={setSelectedIndex}
        setActivePlayerIndex={setActivePlayerIndex}
        setScreen={setScreen}
        startGame={startGame}
        setGameState={setGameState}
        setPendingAction={setPendingAction}
        setPlayers={setPlayers}
      />
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