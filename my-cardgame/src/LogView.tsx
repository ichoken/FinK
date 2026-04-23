// src/LogView.tsx
import React, { useEffect, useRef } from 'react';

type Props = {
  log: string[];
  onClear?: () => void;
};

export function LogView({ log, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    // 少し遅らせてレンダリング後にスクロール
    const el = bottomRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [log.length]);

  return (
    <aside
      style={{
        width: 1500,                 // 固定幅（左寄せに見えるように親レイアウトで調整）
        margin: 0,                  // 左寄せにするなら親で余白を調整
        padding: '12px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 8,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
        alignSelf: 'flex-start',   // 親が flex の場合に左寄せにする
      }}
      aria-label="ゲームログ"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>ログ</div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '0.25rem 0.5rem',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            クリア
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          height: '4.5rem',          // 目安：3行分の高さ（行高さ約1.5rem想定）
          overflowY: 'auto',
          fontSize: '0.85rem',
          lineHeight: '1.5rem',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          paddingRight: 8,           // スクロールバー分の余白
        }}
      >
        {log.length === 0 ? (
          <div style={{ opacity: 0.7 }}>ログはありません。</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {entry}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}