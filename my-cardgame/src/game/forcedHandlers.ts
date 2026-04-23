// src/game/forcedHandlers.ts
import type { ForcedEvent } from './forcedQueue';
import { forcedQueue } from './forcedQueue';
import type { GameState, PlayerState } from '../types';
import type { CardDefinition } from '../cards';

/**
 * sleep: UI 表示のための小遅延（任意）
 */
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * handleForcedEvent:
 * - ev を受け取り、setState を通して GameState を更新する。
 * - ここでは差し押さえ(No.10) と 混乱(No.11) の簡易処理を実装。
 * - 他カードはログのみ残す。
 *
 * 注意: setState は React の setState (updater) を想定しています。
 */
export async function handleForcedEvent(
  ev: ForcedEvent,
  getState: () => GameState,
  setState: (updater: (s: GameState) => GameState) => void
) {
  const { card, playerIndex, context } = ev;

  // 小さな遅延で発動を視認できるようにする（UI のため）
  await sleep(180);

  const state = getState();
  const player = state.players[playerIndex];
  if (!player || player.isEliminated) {
    // 発動者が既に脱落している場合は無視
    setState((prev) => ({ ...prev, log: [...prev.log, `強制発動: ${card.name} の発動者が脱落していたため無効化`] }));
    return;
  }

  // 汎用ログ
  setState((prev) => ({ ...prev, log: [...prev.log, `強制発動: ${card.name} が ${player.name} により発動（${context?.source ?? 'unknown'}）`] }));

  // 差し押さえ (No.10) の処理（簡易：ランダム譲渡）
  if (card.no === 10) {
    // 発動者の手札が0なら何もしない
    if (player.hand.length === 0) {
      setState((prev) => ({ ...prev, log: [...prev.log, `${player.name} の手札が0枚のため差し押さえは何もしませんでした`] }));
      return;
    }

    // 受け取り可能なプレイヤーを列挙（脱落していない・手札が4枚未満）
    const receivers = state.players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p, idx }) => idx !== playerIndex && !p.isEliminated && p.hand.length < 4);

    if (receivers.length === 0) {
      setState((prev) => ({ ...prev, log: [...prev.log, `差し押さえ: 受け取り可能なプレイヤーがいないため何もしませんでした`] }));
      return;
    }

    // 簡易実装: ランダムに受け取り先を選び、発動者の先頭カードを譲渡
    const chosen = receivers[Math.floor(Math.random() * receivers.length)];
    const receiverIndex = chosen.idx;
    const cardToGive = player.hand[0];

    setState((prev) => {
      const players = prev.players.map((p) => ({ ...p, hand: [...p.hand] }));
      // remove from giver
      players[playerIndex].hand = players[playerIndex].hand.slice(1);
      // add to receiver
      players[receiverIndex].hand = [...players[receiverIndex].hand, cardToGive];
      return {
        ...prev,
        players,
        log: [...prev.log, `${prev.players[playerIndex].name} は ${cardToGive.name} を ${prev.players[receiverIndex].name} に譲渡した（差し押さえ）`],
      };
    });

    return;
  }

  // 混乱 (No.11) の処理：手札公開（ログに出す）
  if (card.no === 11) {
    setState((prev) => {
      const handNames = prev.players[playerIndex].hand.map((c) => c.name).join(', ') || '（なし）';
      return { ...prev, log: [...prev.log, `${prev.players[playerIndex].name} の手札を公開: ${handNames}`] };
    });
    return;
  }

  // デフォルト: 未実装カードはログだけ残す
  setState((prev) => ({ ...prev, log: [...prev.log, `強制発動: ${card.name} のハンドラは未実装です`] }));
}