import { useEffect, useRef, useState } from 'react';
import { cards, type CardDefinition } from './cards';
import { createDefaultPlayers, type PlayerInfo, PLAYER_COUNT, HUMAN_PLAYER_INDEX } from './gameConfig';
import { useMerchant } from './effects/merchant';
import { useProphet } from './effects/prophet';
import type { GameMode, GameState, PendingAction, Screen } from './types';
import { advanceToNextPlayer } from './utils/advanceTurn';
import { runCpuTurn } from './cpu/runCpuTurn';
import { eliminatePlayerAndUpdate, eliminatePlayerPure } from './eliminationHandlers';
import { checkElimination } from './eliminationCheck';
import { handleGameOver } from './victoryHandlers';
import { applyForcedEffect } from './utils/forcedEffect';
import {
  checkVictoryOnHandChange,
  checkVictoryOnElimination,
} from './victoryCheck';
import { applyDeckEmptyVictory } from './utils/deckVictory';
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
import { resolveFinKHandler } from './effects/finkHandler';
import { resolveBlackMagicianHandler } from './effects/blackMagicianHandler'
import { finishFortuneHandler } from './effects/fortuneFinishHandler';
import { handleCpuPendingAction } from './cpu/handleCpuPendingAction';
import { listHypnotistTargets, resolveHypnotistOnTarget } from './effects/hypnotistHandler';
import type { CardActivationPreview } from './components/CardActivationOverlay';
import { CardMessageOverlay, type CardMessagePreview } from './components/CardMessageOverlay';






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

function drawInitialNonForce(deck: CardDefinition[]): CardDefinition | undefined {
  // 初回ドロー（初期配布）は強制発動（混乱/差し押さえ）を除外して引く
  const idx = deck.findIndex((c) => c.type !== 'force' && c.no !== 10 && c.no !== 11);
  if (idx === -1) return undefined;
  const [picked] = deck.splice(idx, 1);
  return picked;
}



export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('debug');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>(() => createDefaultPlayers());
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [activationPreview, setActivationPreview] = useState<CardActivationPreview | null>(null);
  const [cardMessagePreview, setCardMessagePreview] = useState<CardMessagePreview | null>(null);
  const [hypnosisStack, setHypnosisStack] = useState<Array<{ returnTo: number }>>([]);
  const hypnosisStackRef = useRef(hypnosisStack);
  const cpuTurnRunningRef = useRef(false);
  const gameModeRef = useRef<GameMode>(gameMode);
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const hands: CardDefinition[][] = Array.from({ length: PLAYER_COUNT }, () => []);
    // 各プレイヤーに2枚ずつ配る（プレイヤー順に配布）
    for (let p = 0; p < PLAYER_COUNT; p += 1) {
      for (let i = 0; i < 2; i += 1) {
        const card = drawInitialNonForce(deck);
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

  // setGameState が非同期でも「最新 state」を参照できるようにする
  const gameStateRef = useRef<GameState>(gameState);
  const playersRef = useRef<PlayerInfo[]>(players);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    hypnosisStackRef.current = hypnosisStack;
  }, [hypnosisStack]);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    if (!pendingAction) return;
    if (!('player' in pendingAction)) return;

    const actingPlayer = pendingAction.player;
    if (playersRef.current[actingPlayer]?.kind !== 'cpu') return;

    // gameState コミット後に実行（setState 内で setPending した直後の stale 回避）
    queueMicrotask(() => {
      handleCpuPendingAction({
        pendingAction,
        activePlayerIndex: actingPlayer,
        players: playersRef.current,
        gameState: gameStateRef.current,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
        onShowActivation: showActivationByNo,
        onShowCardMessageOverlay: showCardMessageOverlay,
      });
    });
  }, [pendingAction]);

  // 催眠術師などの「強制発動」連鎖が終わったら、最初の発動者の次へ手番を戻す
  useEffect(() => {
    if (pendingAction !== null) return;
    if (hypnosisStack.length === 0) return;

    const top = hypnosisStack[hypnosisStack.length - 1];
    setHypnosisStack((prev) => prev.slice(0, -1));
    setActivePlayerIndex(() => top.returnTo);
    setSelectedIndex(null);
  }, [pendingAction, hypnosisStack.length]);

  // 催眠中は、通常効果の「ターン進行」を抑止する（最後にまとめて戻す）
  const setActivePlayerIndexControlled = (fn: (n: number) => number) => {
    if (hypnosisStack.length > 0) return;
    setActivePlayerIndex(fn);
  };

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const getCardByNo = (no: number) => cards.find((c) => c.no === no);

  const showActivation = async (
    card: CardDefinition,
    sourceIndex: number,
    targetIndex?: number,
    kind: 'activate' | 'draw' = 'activate',
  ) => {
    setActivationPreview({ card, sourceIndex, targetIndex, kind });
    await sleep(kind === 'draw' ? 1500 : 2000);
    setActivationPreview(null);
  };

  const showDrawOverlay = async (card: CardDefinition, playerIndex: number) => {
    await showActivation(card, playerIndex, undefined, 'draw');
  };

  const showActivationByNo = async (cardNo: number, sourceIndex: number, targetIndex?: number) => {
    const card = getCardByNo(cardNo);
    if (!card) return;
    await showActivation(card, sourceIndex, targetIndex);
  };
  // ★ カード＋メッセージオーバーレイを 2 秒表示
  const showCardMessageOverlay = async (cardNos: number[], message: string) => {
    setCardMessagePreview({ cardNos, message });
    await sleep(2000);
    setCardMessagePreview(null);
  };


  const forcePlayFromHand = (playerIndex: number, cardIndex: number, returnTo: number) => {
    // 強制発動中は、一時的に「そのプレイヤーが発動した扱い」で処理を進める
    setHypnosisStack((prev) => [...prev, { returnTo }]);
    setActivePlayerIndex(() => playerIndex);
    setSelectedIndex(null);

    const currentPlayers = playersRef.current;
    const hand = gameStateRef.current.hands[playerIndex] ?? [];
    const safeIndex =
      cardIndex >= 0 && cardIndex < hand.length
        ? cardIndex
        : hand.length > 0
          ? Math.floor(Math.random() * hand.length)
          : -1;
    const snapshot = safeIndex >= 0 ? hand[safeIndex] : undefined;
    if (!snapshot) return;

    // FinK / 黒魔術師は副作用ハンドラなので先に分岐（ログを上書きしない）
    if (snapshot.no === 6) {
      resolveBlackMagicianHandler({
        activePlayerIndex: playerIndex,
        players: currentPlayers,
        gameState: gameStateRef.current,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
      });
      return;
    }

    if (snapshot.no === 12) {
      resolveFinKHandler({
        activePlayerIndex: playerIndex,
        players: currentPlayers,
        gameState: gameStateRef.current,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      });
      return;
    }

    // 催眠術師（No.9）は強制発動でも効果を実行する
    if (snapshot.no === 9) {
      const returnToNext = returnTo;

      // 使用カードは必ず墓地へ
      setGameState((prev) => discardUsedCard(prev, playerIndex, 9));

      const stateForTargets = gameStateRef.current; // 対象抽出は発動者の手札変化に影響されない
      const targets = listHypnotistTargets(playerIndex, stateForTargets, currentPlayers);

      if (targets.length === 0) {
        setGameState((prev) => ({
          ...prev,
          log: [...prev.log, `${currentPlayers[playerIndex].name} は催眠術師を強制発動しましたが、対象者がいませんでした。`],
        }));
        setPendingAction(null);
        return;
      }

      // 強制発動された本人が human の場合は対象選択へ（「本人が発動した扱い」）
      if (currentPlayers[playerIndex].kind === 'human') {
        setPendingAction({
          kind: 'hypnotist',
          player: playerIndex,
          step: 'chooseTarget',
          returnTo: returnToNext,
        });
        return;
      }

      // CPU の場合はランダム対象
      const targetIndex = targets[Math.floor(Math.random() * targets.length)];
      const { didForce } = resolveHypnotistOnTarget({
        sourcePlayerIndex: playerIndex,
        targetIndex,
        players: currentPlayers,
        gameState: stateForTargets,
        setGameState,
        onForcePlayFromHand: (forcedPlayerIndex, cardIndex) => {
          forcePlayFromHand(forcedPlayerIndex, cardIndex, returnToNext);
        },
      });

      setPendingAction(null);
      if (!didForce) {
        // 防御などで不発ならチェーンを進める（最終復帰は hypnosisStack が処理）
        return;
      }

      return;
    }

    // 「直前の state(prev)」に対して効果を適用し、催眠術師ログが消えないようにする
    setGameState((prev) => {
      const card = prev.hands[playerIndex]?.[safeIndex];
      if (!card) return prev;

      if (card.no === 1) {
        const res = useProphet(prev, playerIndex, currentPlayers);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.no === 2) {
        const res = useMerchant(prev, playerIndex, safeIndex, currentPlayers);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.no === 3) {
        const res = useMagician(prev, playerIndex, currentPlayers);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.no === 4) {
        const res = useThief(prev, playerIndex, currentPlayers);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.no === 5) {
        const res = useFortuneTeller(prev, playerIndex, currentPlayers);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.no === 8) {
        const res = useAngel(prev, playerIndex);
        setPendingAction(res.pending);
        if (res.endTurn) setPendingAction(null);
        return res.nextState;
      }

      if (card.type === 'force') {
        const { state, pending } = applyForcedEffect(prev, playerIndex, currentPlayers);
        if (pending) setPendingAction(pending);
        return state;
      }

      // 未対応カードは通常の「使用（墓地へ）」扱いだけ行う
      const nextHands = prev.hands.map((h) => [...h]);
      const [played] = nextHands[playerIndex].splice(cardIndex, 1);
      setPendingAction(null);
      return {
        ...prev,
        hands: nextHands,
        discard: [...prev.discard, played],
        log: [...prev.log, `${currentPlayers[playerIndex].name} がカードを使用しました。（${played.name}）`],
      };
    });
  };

  const advanceTurnAfterDraw = () => {
    if (gameModeRef.current !== 'game') return;
    if (gameStateRef.current.gameOver) return;
    if (hypnosisStackRef.current.length > 0) return;
    setActivePlayerIndex((prev) => advanceToNextPlayer(prev, playersRef.current));
    setSelectedIndex(null);
  };

  const startGame = (mode: GameMode = 'debug') => {
    setGameMode(mode);
    gameModeRef.current = mode;
    setGameState(() => {
      const deck = buildInitialDeck();
      const hands: CardDefinition[][] = Array.from({ length: PLAYER_COUNT }, () => []);
      for (let p = 0; p < PLAYER_COUNT; p += 1) {
        for (let i = 0; i < 2; i += 1) {
          const card = drawInitialNonForce(deck);
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
    setPendingAction(null);
    setHypnosisStack([]);
    cpuTurnRunningRef.current = false;
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
        setActivePlayerIndex: setActivePlayerIndexControlled,
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
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      });
      return;
    }

    // 通常のカード選択（カード使用モーダル）
    setSelectedIndex(index);
  };

  const confirmUseSelected = async () => {
    if (selectedIndex === null) return;
    await playCardAtIndex(activePlayerIndex, selectedIndex);
  };

  const playCardAtIndex = async (playerIndex: number, index: number) => {
    const card = gameState.hands[playerIndex][index];
    if (!card) return;

    // プレイヤー発動時：相手（対象プレイヤー）を選ぶカードは「選択前の演出」を出さない。
    // （対象確定後の演出は resolve◯◯Target 側で表示する）
    const needsTargetPlayer =
      card.no === 3 || // 手品師
      card.no === 4 || // シーフ
      card.no === 5 || // 占い師
      card.no === 9;   // 催眠術師

    if (!needsTargetPlayer) {
      await showActivation(card, playerIndex);
    }

    if (card.no === 1) {
      const { nextState, pending, endTurn } = useProphet(
        gameState,
        playerIndex,
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
        playerIndex,
        index,
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
        playerIndex,
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
        playerIndex,
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
        playerIndex,
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
        playerIndex
      );

      setGameState(nextState);
      setSelectedIndex(null);
      setPendingAction(pending);

      if (endTurn) {
        setActivePlayerIndex(prev => (prev + 1) % players.length);
      }

      return;
    }

    if (card.no === 9) {
      const returnTo = advanceToNextPlayer(playerIndex, players);
      setSelectedIndex(null);

      const stateAfterDiscard = discardUsedCard(
        gameStateRef.current,
        playerIndex,
        9,
      );
      setGameState(stateAfterDiscard);

      if (players[playerIndex].kind === 'human') {
        const targets = listHypnotistTargets(
          playerIndex,
          stateAfterDiscard,
          players,
        );
        if (targets.length === 0) {
          setGameState((prev) => ({
            ...prev,
            log: [
              ...prev.log,
              `${players[playerIndex].name} は催眠術師を使用しましたが、対象者がいませんでした。`,
            ],
          }));
          setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
          return;
        }

        setPendingAction({
          kind: 'hypnotist',
          player: playerIndex,
          step: 'chooseTarget',
          returnTo,
        });

        return;
      }

      const targets = listHypnotistTargets(
        playerIndex,
        stateAfterDiscard,
        players,
      );
      if (targets.length === 0) {
        setGameState((prev) => ({
          ...prev,
          log: [
            ...prev.log,
            `${players[playerIndex].name} は催眠術師を使用しましたが、対象者がいませんでした。`,
          ],
        }));
        setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
        return;
      }

      const targetIndex = targets[Math.floor(Math.random() * targets.length)];
      const { didForce } = await resolveHypnotistOnTarget({
        sourcePlayerIndex: playerIndex,
        targetIndex,
        players,
        gameState: stateAfterDiscard,
        setGameState,
        onForcePlayFromHand: (targetPlayerIndex, forcedCardIndex) => {
          forcePlayFromHand(targetPlayerIndex, forcedCardIndex, returnTo);
        },
        onShowCardMessageOverlay: showCardMessageOverlay,
      });

      if (!didForce) {
        setActivePlayerIndex((prev) => advanceToNextPlayer(prev, players));
      }
      return;
    }
    if (card.no === 6) {
      resolveBlackMagicianHandler({
        activePlayerIndex: playerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
      });
      return;
    }

    if (card.no === 12) {
      resolveFinKHandler({
        activePlayerIndex: playerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex,
        setPlayers,
      });
      return;
    }

    // 他のカードは playFromHand を呼ぶ
    playFromHand(playerIndex, index);
  };

  const drawOne = async () => {
    const actingPlayer = activePlayerIndex;
    const prev = gameStateRef.current;
    const currentPlayers = playersRef.current;

    if (prev.deck.length === 0) {
      const emptyDeckState = applyDeckEmptyVictory(prev, currentPlayers);
      if (emptyDeckState.gameOver) {
        setGameState(emptyDeckState);
      }
      return;
    }

    const nextDeck = [...prev.deck];
    const [drawn] = nextDeck.splice(0, 1);
    const nextHands = prev.hands.map((h) => [...h]);
    nextHands[actingPlayer] = [...nextHands[actingPlayer], drawn];

    let nextState: GameState = {
      ...prev,
      deck: nextDeck,
      hands: nextHands,
      log: [
        ...prev.log,
        `${currentPlayers[actingPlayer].name} がカードを1枚引きました。`,
      ],
    };

    let forcePending: PendingAction | null = null;

    if (drawn.type === 'force') {
      const forced = applyForcedEffect(nextState, actingPlayer, currentPlayers);
      nextState = forced.state;
      forcePending = forced.pending;
    }

    let finalState = nextState;
    const handResult = checkHandChangeCombined(finalState, currentPlayers);

    handResult.eliminated.forEach((idx) => {
      finalState = eliminatePlayerPure(idx, finalState, currentPlayers);
      setPlayers((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, isEliminated: true } : p)),
      );
    });

    if (handResult.win) {
      const winnerNames = handResult.winners
        .map((idx) => currentPlayers[idx].name)
        .join('、');
      finalState = {
        ...finalState,
        gameOver: true,
        winners: handResult.winners,
        log: [...finalState.log, `ゲーム終了！勝者: ${winnerNames}`],
      };
    }

    finalState = applyDeckEmptyVictory(finalState, currentPlayers);

    setGameState(finalState);

    await showDrawOverlay(drawn, actingPlayer);

    if (forcePending !== null) {
      setPendingAction(forcePending);
      return;
    }

    advanceTurnAfterDraw();
  };

  // 正式モード: CPU の手番を自律処理
  useEffect(() => {
    if (gameMode !== 'game' || screen !== 'game') return;
    if (gameState.gameOver) return;
    if (pendingAction !== null) return;
    if (hypnosisStack.length > 0) return;

    const player = players[activePlayerIndex];
    if (player.kind !== 'cpu' || player.isEliminated) return;
    if (cpuTurnRunningRef.current) return;

    cpuTurnRunningRef.current = true;
    const turnPlayer = activePlayerIndex;

    (async () => {
      try {
        await runCpuTurn({
          activePlayerIndex: turnPlayer,
          gameState: gameStateRef.current,
          players: playersRef.current,
          onDraw: () => drawOne(),
          onPlayCard: (idx) => playCardAtIndex(turnPlayer, idx),
          sleep,
        });
      } finally {
        cpuTurnRunningRef.current = false;
      }
    })();
  }, [
    gameMode,
    screen,
    activePlayerIndex,
    pendingAction,
    gameState.gameOver,
    hypnosisStack.length,
    players,
  ]);

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
        const forced = applyForcedEffect(nextState, activePlayerIndex, players);
        if (forced.pending) setPendingAction(forced.pending);
        return forced.state;
      }

      const result = checkHandChangeCombined(nextState, players);

      result.eliminated.forEach(idx => {
        eliminatePlayerAndUpdate({
          playerIndex: idx,
          players,
          setPlayers,
          setGameState,
        });
      });

      if (result.win) {
        handleGameOver({
          winners: result.winners,
          players,
          setGameState,
        });
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


  const playFromHand = (playerIndex: number, index: number) => {
    setGameState((prev) => {
      const playerHand = prev.hands[playerIndex];
      if (index < 0 || index >= playerHand.length) return prev;
      const nextHands = prev.hands.map((h) => [...h]);
      const [played] = nextHands[playerIndex].splice(index, 1);
      return {
        ...prev,
        deck: prev.deck,
        hands: nextHands,
        discard: [...prev.discard, played],
        log: [...prev.log, `${players[playerIndex].name} がカードを使用しました。（${played.name}）`],
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
        setActivePlayerIndex: setActivePlayerIndexControlled,
      }),

    resolveFortuneTarget: async (targetIndex: number) => {
      const source = pendingAction?.player ?? activePlayerIndex;
      await showActivationByNo(5, source, targetIndex);
      resolveFortuneTargetHandler({
        targetIndex,
        pendingAction,
        activePlayerIndex: source,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        onShowCardMessageOverlay: showCardMessageOverlay,
      });
    },

    finishFortune: () =>
      finishFortuneHandler({
        pendingAction,
        players,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
      }),

    resolveThiefTarget: async (targetIndex: number) => {
      const source = pendingAction?.player ?? activePlayerIndex;
      await showActivationByNo(4, source, targetIndex);
      await resolveThiefTargetHandler({
        targetIndex,
        pendingAction,
        activePlayerIndex: source,
        players,
        gameState: gameStateRef.current,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
        onShowCardMessageOverlay: showCardMessageOverlay,
      });
    },

    resolveHypnotistTarget: async (targetIndex: number) => {
      if (!pendingAction || pendingAction.kind !== 'hypnotist') return;

      const sourcePlayerIndex = pendingAction.player;
      const returnTo = pendingAction.returnTo;

      await showActivationByNo(9, sourcePlayerIndex, targetIndex);

      const { didForce } = await resolveHypnotistOnTarget({
        sourcePlayerIndex,
        targetIndex,
        players,
        gameState: gameStateRef.current,
        setGameState,
        onForcePlayFromHand: (forcedPlayerIndex, forcedCardIndex) => {
          forcePlayFromHand(forcedPlayerIndex, forcedCardIndex, returnTo);
        },
        onShowCardMessageOverlay: showCardMessageOverlay,
      });

      setPendingAction(null);
      if (!didForce) setActivePlayerIndexControlled(() => returnTo);
    },

    resolveMagicianTarget: async (targetIndex: number) => {
      const source = pendingAction?.player ?? activePlayerIndex;
      await showActivationByNo(3, source, targetIndex);
      resolveMagicianTargetHandler(targetIndex, {
        pendingAction,
        activePlayerIndex: source,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
        onShowCardMessageOverlay: showCardMessageOverlay,
      });
    },

    chooseMagicianSelfCard: (selfIdx: number) =>
      chooseMagicianSelfCardHandler(selfIdx, {
        pendingAction,
        activePlayerIndex: pendingAction?.player ?? activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      }),

    chooseMagicianOpponentCard: (oppIdx: number) =>
      chooseMagicianOpponentCardHandler(oppIdx, {
        pendingAction,
        activePlayerIndex: pendingAction?.player ?? activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      }),

    chooseMagicianOpponentCardAuto: () =>
      chooseMagicianOpponentCardAutoHandler({
        pendingAction,
        activePlayerIndex: pendingAction?.player ?? activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      }),

    resolveMagicianSwap: () =>
      resolveMagicianSwapHandler({
        pendingAction,
        activePlayerIndex: pendingAction?.player ?? activePlayerIndex,
        players,
        gameState,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      }),

    resolveAngel: (discardIndex: number) =>
      resolveAngelHandler({
        discardIndex,
        pendingAction,
        activePlayerIndex: pendingAction?.player ?? activePlayerIndex,
        players,
        gameState: gameStateRef.current,
        setGameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
      }),
    resolveConfusion: () =>
      resolveConfusionHandler({
        pendingAction,
        activePlayerIndex,
        players,
        gameState,
        setPendingAction,
        setActivePlayerIndex: setActivePlayerIndexControlled,
      }),
    chooseSeizureTarget: async (targetIndex: number) => {
      await showActivationByNo(10, activePlayerIndex, targetIndex);
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
        setActivePlayerIndex: setActivePlayerIndexControlled,
        setPlayers,
        cardIndex,
      }),
  };

  if (screen === 'game') {
    return (
      <>
        <GameScreen
          gameMode={gameMode}
          players={players}
          gameState={gameState}
          activePlayerIndex={activePlayerIndex}
          selectedIndex={selectedIndex}
          pendingAction={pendingAction}
          activationPreview={activationPreview}
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
        <CardMessageOverlay preview={cardMessagePreview} cards={cards} />
      </>
    );
  }

  if (screen === 'title') {
    return <TitleScreen startGame={(mode) => startGame(mode)} />;
  }

}