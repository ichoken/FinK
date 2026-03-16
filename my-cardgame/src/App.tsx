// src/App.tsx
import React, { useRef, useState } from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards, buildInitialDeck, type CardDefinition } from './cards';
import { forcedQueue } from './game/forcedQueue';
import { handleForcedEvent } from './game/forcedHandlers';
import type { GameState, PlayerState } from './types';

/**
 * 簡易的な createDefaultPlayers（既存の gameConfig があれば置換してください）
 */
function createDefaultPlayers(): PlayerState[] {
  return [
    { id: 0, name: 'Player', kind: 'human', hand: [], isEliminated: false },
    { id: 1, name: 'CPU 1', kind: 'cpu', hand: [], isEliminated: false },
    { id: 2, name: 'CPU 2', kind: 'cpu', hand: [], isEliminated: false },
    { id: 3, name: 'CPU 3', kind: 'cpu', hand: [], isEliminated: false },
  ];
}

/**
 * dealInitialHands: スタートプレイヤー startIndex から時計回りに1枚ずつ2周配る
 * 仕様: 配り終わるまで勝利/脱落判定は行わない（呼び出し側で判定を行う）
 */
function dealInitialHands(deck: CardDefinition[], players: PlayerState[], startIndex: number) {
  const deckCopy = [...deck];
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < players.length; i++) {
      const idx = (startIndex + i) % players.length;
      if (deckCopy.length === 0) break;
      const card = deckCopy.shift()!;
      players[idx].hand.push(card);
      // 初期配布時は仕様により強制発動は配布後に一括判定するため enqueue しない
    }
  }
  return deckCopy;
}

/**
 * checkVictoryAndElimination: 簡易実装（詳細ルールは別途拡張）
 * - 山札0か、シスター4枚所持、他プレイヤー全員脱落などはここで判定する
 */
function checkVictoryAndElimination(state: GameState): { winnerId: number | null; eliminated: number[] } {
  // 簡易: 山札0かつ FinK 所持者が勝利
  if (state.deck.length === 0) {
    for (const p of state.players) {
      if (p.hand.some((c) => c.no === 12)) {
        return { winnerId: p.id, eliminated: [] };
      }
    }
  }

  // シスター4枚で勝利
  for (const p of state.players) {
    const sisterCount = p.hand.filter((c) => c.no === 7).length;
    if (sisterCount >= 4) {
      return { winnerId: p.id, eliminated: [] };
    }
  }

  // 他プレイヤー全員脱落
  const alive = state.players.filter((p) => !p.isEliminated);
  if (alive.length === 1) {
    return { winnerId: alive[0].id, eliminated: [] };
  }

  return { winnerId: null, eliminated: [] };
}

export default function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [players] = useState<PlayerState[]>(() => createDefaultPlayers());
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // GameState を useState で管理
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = buildInitialDeck();
    const playersCopy = createDefaultPlayers();
    // ランダムスタート
    const startIndex = Math.floor(Math.random() * playersCopy.length);
    const remainingDeck = dealInitialHands(deck, playersCopy, startIndex);
    return {
      deck: remainingDeck,
      discard: [],
      players: playersCopy,
      log: ['ゲーム開始前の状態です。初期配布を行いました。'],
      activePlayerIndex: startIndex,
    };
  });

  // ref で最新 state を参照できるようにする（forcedHandlers から参照するため）
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const getState = () => stateRef.current;

  // ユーティリティ: setState wrapper
  const setStateWrapper = (updater: (s: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  };

  // startGame: 新規ゲーム開始（タイトルから）
  const startGame = () => {
    const deck = buildInitialDeck();
    const playersCopy = createDefaultPlayers();
    const startIndex = Math.floor(Math.random() * playersCopy.length);
    const remainingDeck = dealInitialHands(deck, playersCopy, startIndex);
    const initialState: GameState = {
      deck: remainingDeck,
      discard: [],
      players: playersCopy,
      log: ['新しいゲームを開始しました。初期手札を配りました。'],
      activePlayerIndex: startIndex,
    };
    setGameState(initialState);
    stateRef.current = initialState;
    setScreen('game');
  };

  // drawOne: 現在のアクティブプレイヤーが1枚ドローする処理
  const drawOne = (playerIndex: number) => {
    setStateWrapper((prev) => {
      const players = prev.players.map((p) => ({ ...p, hand: [...p.hand] }));
      const player = players[playerIndex];
      if (!player || player.isEliminated) return prev;
      if (prev.deck.length === 0) return prev;
      if (player.hand.length >= 4) return prev;

      const [top, ...rest] = prev.deck;
      player.hand = [...player.hand, top];

      const newState: GameState = {
        ...prev,
        deck: rest,
        players,
        log: [...prev.log, `${player.name} がカードを1枚ドローしました。（${top.name}）`],
      };

      // 山札が0になったドロー例外: このドローで山札が0になった場合は強制発動を行わず、即座に勝敗判定へ
      const deckBecameEmpty = rest.length === 0;
      if (!deckBecameEmpty) {
        // 強制発動ON のカードならキューに入れる
        if (top.force === 'ON') {
          forcedQueue.enqueue({ card: top, playerIndex, context: { source: 'draw' } });
          // キュー処理を開始（非同期）
          void forcedQueue.process(async (ev) => {
            await handleForcedEvent(ev, getState, setStateWrapper);
            // 発動後に勝利/脱落判定を行う（簡易）
            const res = checkVictoryAndElimination(getState());
            if (res.winnerId !== null) {
              setStateWrapper((s) => ({ ...s, log: [...s.log, `勝者: ${s.players.find(p => p.id === res.winnerId)!.name}`] }));
            }
          });
        }
      } else {
        // 山札が0になったので勝敗判定（仕様：最後のドローで強制発動は行わない）
        const res = checkVictoryAndElimination(newState);
        if (res.winnerId !== null) {
          newState.log = [...newState.log, `勝者: ${newState.players.find(p => p.id === res.winnerId)!.name}`];
        } else {
          newState.log = [...newState.log, '山札が0になりました。勝敗判定を行いましたが勝者は決定しませんでした。'];
        }
      }

      return newState;
    });
  };

  // debugDrawSpecific: デバッグ用に特定カードを手札に追加（強制発動は通常通り扱う）
  const debugDrawSpecific = (playerIndex: number, cardNo: number) => {
    setStateWrapper((prev) => {
      const players = prev.players.map((p) => ({ ...p, hand: [...p.hand] }));
      const player = players[playerIndex];
      if (!player || player.isEliminated) return prev;
      if (player.hand.length >= 4) return prev;

      const indexInDeck = prev.deck.findIndex((c) => c.no === cardNo);
      if (indexInDeck === -1) return prev;

      const nextDeck = [...prev.deck];
      const [picked] = nextDeck.splice(indexInDeck, 1);
      player.hand = [...player.hand, picked];

      const newState: GameState = {
        ...prev,
        deck: nextDeck,
        players,
        log: [...prev.log, `デバッグ: ${player.name} に No.${picked.no} ${picked.name} を追加しました`],
      };

      // 強制発動処理（山札が0になったケースはここでは発生しない想定）
      if (picked.force === 'ON') {
        forcedQueue.enqueue({ card: picked, playerIndex, context: { source: 'debug' } });
        void forcedQueue.process(async (ev) => {
          await handleForcedEvent(ev, getState, setStateWrapper);
          const res = checkVictoryAndElimination(getState());
          if (res.winnerId !== null) {
            setStateWrapper((s) => ({ ...s, log: [...s.log, `勝者: ${s.players.find(p => p.id === res.winnerId)!.name}`] }));
          }
        });
      }

      return newState;
    });
  };

  // playFromHand: 手札からカードを使用する（簡易）
  const playFromHand = (playerIndex: number, handIndex: number) => {
    setStateWrapper((prev) => {
      const players = prev.players.map((p) => ({ ...p, hand: [...p.hand] }));
      const player = players[playerIndex];
      if (!player || player.isEliminated) return prev;
      if (handIndex < 0 || handIndex >= player.hand.length) return prev;

      const [played] = player.hand.splice(handIndex, 1);
      const newState: GameState = {
        ...prev,
        players,
        discard: [...prev.discard, played],
        log: [...prev.log, `${player.name} が ${played.name} を使用しました`],
      };

      // 黒魔術師 (No.6) の使用フロー（使用しても墓地に置かれず、手札と山札をシャッフルして山札に戻す）
      if (played.no === 6) {
        const pool = [...newState.deck, ...player.hand];
        // shuffle
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        // 使用者の手札は空にする（仕様）
        players[playerIndex].hand = [];
        newState.deck = pool;
        newState.log = [...newState.log, `${player.name} が 黒魔術師 を使用し、手札と山札をシャッフルしました`];
        // 黒魔術師は墓地に置かない（仕様） → 既に discard に入れたが仕様に合わせるなら remove from discard
        newState.discard = newState.discard.filter((c) => c.no !== 6);
      }

      // FinK (No.12) を使用した場合は使用者が敗北（脱落フロー）
      if (played.no === 12) {
        // 脱落処理（簡易）
        players[playerIndex].isEliminated = true;
        newState.log = [...newState.log, `${player.name} は FinK を使用し脱落しました`];
        // 脱落時の手札と山札をシャッフルして山札に戻す（脱落要因カード以外の手札は非公開のまま）
        const pool = [...players[playerIndex].hand, ...newState.deck];
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        newState.deck = pool;
        players[playerIndex].hand = [];
      }

      // 使用後に勝利/脱落判定（簡易）
      const res = checkVictoryAndElimination(newState);
      if (res.winnerId !== null) {
        newState.log = [...newState.log, `勝者: ${newState.players.find(p => p.id === res.winnerId)!.name}`];
      }

      return newState;
    });
  };

  // UI: 現在は簡易表示。必要に応じて CardView 等に置換してください。
  if (screen === 'title') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>FinK</h1>
        <button onClick={startGame} style={{ padding: '12px 20px', fontSize: 16 }}>ゲーム開始</button>
      </div>
    );
  }

  // game screen
  const activePlayer = gameState.players[gameState.activePlayerIndex];

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
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>FinK</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', opacity: 0.9 }}>
            現在の手番: {activePlayer?.name} {activePlayer?.kind === 'human' ? '(あなた)' : '(CPU)'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setGameState((prev) => ({ ...prev, activePlayerIndex: (prev.activePlayerIndex + 1) % prev.players.length }))}
            style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Next player
          </button>
          <button
            type="button"
            onClick={() => setScreen('title')}
            style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Back to title
          </button>
        </div>
      </header>

      <main style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '1rem' }}>
          <div>山札: {gameState.deck.length} 枚</div>
          <div>捨て札: {gameState.discard.length} 枚</div>
        </div>

        <section style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0 }}>プレイヤー一覧</h3>
            <ul>
              {gameState.players.map((p, idx) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  <strong>{p.name}</strong> {p.isEliminated ? '（脱落）' : ''} - 手札: {p.hand.length} 枚 {gameState.activePlayerIndex === idx ? '←' : ''}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ width: 420 }}>
            <h3 style={{ marginTop: 0 }}>アクティブプレイヤーの手札</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activePlayer.hand.map((c, i) => (
                <div key={`${c.no}-${i}`} style={{ width: 120, padding: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12 }}>{c.description}</div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => playFromHand(gameState.activePlayerIndex, i)} style={{ marginRight: 6 }}>使用</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => drawOne(gameState.activePlayerIndex)} style={{ marginRight: 8 }}>山札からドロー</button>
              <button onClick={() => debugDrawSpecific(gameState.activePlayerIndex, 10)} style={{ marginRight: 8 }}>デバッグ: 差し押さえを引く</button>
              <button onClick={() => debugDrawSpecific(gameState.activePlayerIndex, 11)} style={{ marginRight: 8 }}>デバッグ: 混乱を引く</button>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>ログ</h3>
          <div style={{ maxHeight: 220, overflow: 'auto', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
            {gameState.log.slice().reverse().map((l, idx) => (
              <div key={idx} style={{ marginBottom: 6 }}>{l}</div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}