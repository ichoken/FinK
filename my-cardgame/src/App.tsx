import { useEffect, useState } from 'react';
import { cards, type CardDefinition } from './cards';
import { createDefaultPlayers, type PlayerInfo, PLAYER_COUNT, HUMAN_PLAYER_INDEX } from './gameConfig';
import { useMerchant } from './effects/merchant';
import { useProphet } from './effects/prophet';
import type { GameState, PendingAction, Screen } from './types';
import { eliminatePlayerAndUpdate } from './eliminationHandlers';
import { checkElimination } from './eliminationCheck';
import { handleGameOver } from './victoryHandlers';
import { applyForcedEffect } from './utils/forcedEffect';
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
import { useAngel } from './effects/angel';
import { checkHandChangeCombined } from './utils/checkHandChangeCombined';
import { resolveProphetHandler } from './effects/prophetHandler';
import { resolveMerchantHandler } from './effects/merchantHandler';
import { resolveFortuneTargetHandler } from './effects/fortuneHandler';
import { resolveThiefTargetHandler } from './effects/thiefHandler';
import {
  resolveMagicianTargetHandler,
  chooseMagicianSelfCardHandler,
  chooseMagicianOpponentCardAutoHandler,
  chooseMagicianOpponentCardHandler,
  resolveMagicianSwapHandler,
} from './effects/magicianHandler';
import { resolveAngelHandler } from './effects/angelHandler';
import { resolveConfusionHandler } from './effects/confusionHandler';
import { resolveSeizureHandler } from './effects/seizureHandler';
import { finishFortuneHandler } from './effects/fortuneFinishHandler';






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
        chooseMagicianOpponentCardAutoHandler({
          pendingAction,
          activePlayerIndex,
          players,
          gameState,
          setGameState,
          setPendingAction,
          setActivePlayerIndex,
          setPlayers,
        });
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
    // 商人のカード選択
    if (pendingAction?.kind === 'merchant') {
      resolveMerchantHandler({
        index,
        pendingAction,
        players,
        setGameState,
        setPendingAction,
        setSelectedIndex,
        setActivePlayerIndex,
      });
      return;
    }

    // 手品師の自分カード選択
    if (pendingAction?.kind === 'magician' &&
      pendingAction.step === 'chooseSelfCard') {
      chooseMagicianSelfCardHandler(index, {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      });
      return;
    }

    // 通常のカード選択（カード使用モーダル）
    setSelectedIndex(index);
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

    // --- Angel (No.8) ---
    if (card.no === 8) {
      const { nextState, pending, endTurn } = useAngel(
        gameState,
        activePlayerIndex
      );

      setGameState(nextState);
      setSelectedIndex(null);
      setPendingAction(pending);

      if (endTurn) {
        setActivePlayerIndex(prev => (prev + 1) % players.length);
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

      if (drawn.type === 'force') {
        nextState = applyForcedEffect(
          nextState,
          activePlayerIndex,
          players,
          setGameState,
          setPendingAction
        );

        // 混乱は手札公開だけなので、ここで return して OK
        return nextState;
      }

      // --- 3) 脱落判定 ---
      const elim = checkElimination(activePlayerIndex, nextState);
      if (elim.eliminated) {
        eliminatePlayerAndUpdate({
          playerIndex: activePlayerIndex,
          players,
          setPlayers,
          setGameState,
        });

        return nextState; // ★ ログは eliminatePlayerAndUpdate が出すのでここでは追加しない
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

      if (picked.type === 'force') {
        nextState = applyForcedEffect(
          nextState,
          activePlayerIndex,
          players,
          setGameState,
          setPendingAction
        );

        // 混乱は手札公開だけなので、ここで return して OK
        return nextState;
      }

      // --- 2) 脱落判定 ---
      const elim = checkElimination(activePlayerIndex, nextState);
      if (elim.eliminated) {
        eliminatePlayerAndUpdate({
          playerIndex: activePlayerIndex,
          players,
          setPlayers,
          setGameState,
        });

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
        ...prev,
        deck: prev.deck,
        hands: nextHands,
        discard: [...prev.discard, played],
        log: [...prev.log, `${players[activePlayerIndex].name} がカードを使用しました。（${played.name}）`],
      };
    });
    setSelectedIndex(null);
  };

  const actions = {
    resolveProphet: () =>
      resolveProphetHandler({
        pendingAction,
        players,
        activePlayerIndex,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
      }),

    resolveFortuneTarget: (targetIndex: number) =>
      resolveFortuneTargetHandler({
        targetIndex,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
      }),

    finishFortune: () =>
      finishFortuneHandler({
        pendingAction,
        players,
        setPendingAction,
        setActivePlayerIndex,
      }),

    resolveThiefTarget: (targetIndex: number) =>
      resolveThiefTargetHandler({
        targetIndex,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
      }),

    resolveMagicianTarget: (targetIndex: number) =>
      resolveMagicianTargetHandler(targetIndex, {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      }),

    chooseMagicianSelfCard: (selfIdx: number) =>
      chooseMagicianSelfCardHandler(selfIdx, {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      }),

    chooseMagicianOpponentCard: (oppIdx: number) =>
      chooseMagicianOpponentCardHandler(oppIdx, {
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      }),

    resolveMagicianSwap: () =>
      resolveMagicianSwapHandler({
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      }),

    resolveAngel: (discardIndex: number) =>
      resolveAngelHandler({
        discardIndex,
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      }),
    resolveConfusion: () =>
      resolveConfusionHandler({
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setPendingAction,
        setActivePlayerIndex,
      }),
    chooseSeizureTarget: (targetIndex: number) => {
      setPendingAction({
        kind: 'seizure',
        player: activePlayerIndex,
        step: 'chooseCard',
        target: targetIndex,
      });
    },

    resolveSeizure: (cardIndex: number) =>
      resolveSeizureHandler({
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
        cardIndex,
      }),
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
        confirmUseSelected={confirmUseSelected}
        setSelectedIndex={setSelectedIndex}
        setActivePlayerIndex={setActivePlayerIndex}
        setScreen={setScreen}
        startGame={startGame}
        setGameState={setGameState}
        setPendingAction={setPendingAction}
        setPlayers={setPlayers}
        cards={cards}
        actions={actions}
      />
    );
  }

  if (screen === 'title') {
    return <TitleScreen startGame={startGame} />;
  }

}