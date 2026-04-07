import { useEffect, useState } from 'react';
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
import { TitleScreen } from './TitleScreen';
import { useFortuneTeller } from './effects/fortuneTeller';
import { trySisterDefense } from './utils/sisterDefense';
import { discardUsedCard } from './utils/discardUsedCard';
import { useThief } from './effects/thief';
import { useMagician } from './effects/magician';
import { checkHandChangeCombined } from './utils/checkHandChangeCombined';



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

  useEffect(() => {
    if (
      pendingAction?.kind === 'magician' &&
      pendingAction.step === 'chooseOpponentCard'
    ) {
      const target = pendingAction.target!;
      if (players[target].kind === 'cpu') {
        chooseMagicianOpponentCardAuto();
      }
    }
  }, [pendingAction]);

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

    // ★★★ 預言者カードを破棄する ★★★
    setGameState((prev) => {
      const nextHands = prev.hands.map((h) => [...h]);

      // 使用した預言者カードを手札から1枚削除
      const idx = nextHands[p].findIndex((c) => c.no === 1);
      const [usedCard] = nextHands[p].splice(idx, 1);

      return {
        deck: [...ordered, ...prev.deck],
        hands: nextHands,
        discard: [...prev.discard, usedCard],
        log: [
          ...prev.log,
          `${players[p].name} は預言者を使用し、山札の上を並び替えました。`,
        ],
      };
    });

    setPendingAction(null);
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

  const finishFortune = () => {
    setPendingAction(null);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
  };

  const resolveFortuneTarget = (targetIndex: number) => {
    // ★ ログだけ先に追加
    setGameState(prev => ({
      ...prev,
      log: [
        ...prev.log,
        `${players[activePlayerIndex].name} が ${players[targetIndex].name} に対して占い師を発動しました。`,
      ],
    }));

    // ★ シスター防御（破棄もここで行う）
    const defended = trySisterDefense(
      targetIndex,
      gameState,
      players,
      setGameState,
      () => {
        // 使用カード破棄（共通処理）
        setGameState(prev => discardUsedCard(prev, activePlayerIndex, 5));
      }
    );

    if (defended) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    // ★ シスター防御が発動しなかった場合 → ここで破棄
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 5));

    // ★ 手札公開フェーズへ
    setPendingAction({
      kind: 'fortune',
      player: activePlayerIndex,
      step: 'showHand',
      target: targetIndex,
    });
  };

  const resolveThiefTarget = (targetIndex: number) => {
    // ★ 使用カード破棄（共通処理）
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 4));

    // ★ シスター防御
    const defended = trySisterDefense(
      targetIndex,
      gameState,
      players,
      setGameState,
      () => {
        // シスター防御時も破棄（共通処理）
        setGameState(prev => discardUsedCard(prev, activePlayerIndex, 4));
      }
    );

    if (defended) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    // ★ 奪う処理
    setGameState(prev => {
      const nextHands = prev.hands.map(h => [...h]);

      const targetHand = nextHands[targetIndex];
      const stolenIdx = Math.floor(Math.random() * targetHand.length);
      const [stolenCard] = targetHand.splice(stolenIdx, 1);

      nextHands[activePlayerIndex].push(stolenCard);

      return {
        ...prev,
        hands: nextHands,
        log: [
          ...prev.log,
          `${players[activePlayerIndex].name} は ${players[targetIndex].name} から ${stolenCard.name} を盗みました。`,
        ],
      };
    });

    // ★ ターン終了
    setPendingAction(null);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
  };

  const resolveMagicianTarget = (targetIndex: number) => {
    // ★ 使用カード破棄（共通処理）
    setGameState(prev => discardUsedCard(prev, activePlayerIndex, 3));

    // ★ 手品師発動ログ
    setGameState(prev => ({
      ...prev,
      log: [
        ...prev.log,
        `${players[activePlayerIndex].name} が ${players[targetIndex].name} に対して手品師を発動しました。`,
      ],
    }));

    // ★ 対象プレイヤーの手札が0 → 終了
    if (gameState.hands[targetIndex].length === 0) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    // ★ 自分の手札が0 → 終了
    if (gameState.hands[activePlayerIndex].length === 0) {
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    // ★ シスター防御
    const defended = trySisterDefense(
      targetIndex,
      gameState,
      players,
      setGameState,
      () => {
        // シスター防御時も使用カード破棄（共通処理）
        setGameState(prev => discardUsedCard(prev, activePlayerIndex, 3));
      }
    );

    if (defended) {
      // シスターが発動したので何もせず終了
      setPendingAction(null);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
      return;
    }

    // ★ 必ず Step3（自分のカード選択）へ進む
    setPendingAction({
      kind: 'magician',
      player: activePlayerIndex,
      step: 'chooseSelfCard',
      target: targetIndex,
    });
  };
  const chooseMagicianSelfCard = (selfCardIndex: number) => {
    if (!pendingAction || pendingAction.kind !== 'magician') return;
    // ★ 自分のカード選択ログ
    setGameState(prev => ({
      ...prev,
      log: [
        ...prev.log,
        `${players[activePlayerIndex].name} は「${gameState.hands[activePlayerIndex][selfCardIndex].name}」を交換候補として選択しました。`,
      ],
    }));
    setPendingAction({
      kind: 'magician',
      player: activePlayerIndex,
      step: 'chooseOpponentCard',
      target: pendingAction.target,
      selfCardIndex,
    });
  };

  const chooseMagicianOpponentCardAuto = () => {
    if (!pendingAction || pendingAction.kind !== 'magician') return;

    const target = pendingAction.target!;
    const opponentHand = gameState.hands[target];

    // CPU のカード選択アルゴリズム（仮：ランダム）
    const chosen = Math.floor(Math.random() * opponentHand.length);
    // ★ CPU のカード選択ログ
    setGameState(prev => ({
      ...prev,
      log: [
        ...prev.log,
        `${players[pendingAction.target!].name}（CPU）は「${gameState.hands[pendingAction.target!][chosen].name}」を交換候補として選択しました。`,
      ],
    }));

    setPendingAction({
      kind: 'magician',
      player: activePlayerIndex,
      step: 'swap',
      target,
      selfCardIndex: pendingAction.selfCardIndex,
      opponentCardIndex: chosen,
    });
  };
  const chooseMagicianOpponentCard = (opponentCardIndex: number) => {
    if (!pendingAction || pendingAction.kind !== 'magician') return;
    // ★ 相手のカード選択ログ
    setGameState(prev => ({
      ...prev,
      log: [
        ...prev.log,
        `${players[pendingAction.target!].name} は「${gameState.hands[pendingAction.target!][opponentCardIndex].name}」を交換候補として選択しました。`,
      ],
    }));
    setPendingAction({
      kind: 'magician',
      player: activePlayerIndex,
      step: 'swap',
      target: pendingAction.target,
      selfCardIndex: pendingAction.selfCardIndex,
      opponentCardIndex,
    });
  };
  const resolveMagicianSwap = () => {
    if (!pendingAction || pendingAction.kind !== 'magician') return;

    const target = pendingAction.target!;
    const selfIdx = pendingAction.selfCardIndex!;
    const oppIdx = pendingAction.opponentCardIndex!;

    // ★ カード交換処理
    setGameState(prev => {
      const nextHands = prev.hands.map(h => [...h]);

      const selfCard = nextHands[activePlayerIndex][selfIdx];
      const oppCard = nextHands[target][oppIdx];

      // 交換
      nextHands[activePlayerIndex][selfIdx] = oppCard;
      nextHands[target][oppIdx] = selfCard;

      return {
        ...prev,
        hands: nextHands,
        log: [
          ...prev.log,
          `${players[activePlayerIndex].name} と ${players[target].name} は「${selfCard.name}」と「${oppCard.name}」を交換しました。`,
        ],
      };
    });



    // ★ 手札変化後の総合チェック（勝利 + 脱落）
    const result = checkHandChangeCombined(gameState, players);

    // 脱落処理
    result.eliminated.forEach((idx) => {
      eliminatePlayerAndUpdate({
        playerIndex: idx,
        players,
        setPlayers,
        setGameState,
      });
    });

    // 勝利処理
    if (result.win) {
      handleGameOver({
        winners: result.winners,
        players,
        setGameState,
      });
      return;
    }

    // ★ ターン終了
    setPendingAction(null);
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
    if (card.no === 3) {
      const { nextState, pending, endTurn } = useMagician(
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

    if (card.no === 4) {
      const { nextState, pending, endTurn } = useThief(
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

    if (card.no === 5) {
      const { nextState, pending, endTurn } = useFortuneTeller(
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
        cards={cards}
        resolveFortuneTarget={resolveFortuneTarget}
        finishFortune={finishFortune}
        resolveThiefTarget={resolveThiefTarget}
        resolveMagicianTarget={resolveMagicianTarget}
        chooseMagicianSelfCard={chooseMagicianSelfCard}
        chooseMagicianOpponentCard={chooseMagicianOpponentCard}
        resolveMagicianSwap={resolveMagicianSwap}


      />
    );
  }

  if (screen === 'title') {
    return <TitleScreen startGame={startGame} />;
  }

}