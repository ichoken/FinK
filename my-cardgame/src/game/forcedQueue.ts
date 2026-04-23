// src/game/forcedQueue.ts
import type { CardDefinition } from '../cards';

export type ForcedEvent = {
  card: CardDefinition;
  playerIndex: number;
  context?: { source?: string };
};

export class ForcedQueue {
  private queue: ForcedEvent[] = [];
  private processing = false;

  enqueue(ev: ForcedEvent) {
    this.queue.push(ev);
  }

  clear() {
    this.queue = [];
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * process: 与えた processor を FIFO で逐次実行する。
   * processor はイベントを受け取り Promise<void> を返すこと。
   * 既に処理中なら何もしない（重複実行防止）。
   */
  async process(processor: (ev: ForcedEvent) => Promise<void>) {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const ev = this.queue.shift()!;
        await processor(ev);
      }
    } finally {
      this.processing = false;
    }
  }
}

export const forcedQueue = new ForcedQueue();