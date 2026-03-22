// src/BottomLogArea.tsx
import React from 'react';

export function BottomLogArea({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '120px',
        overflowY: 'auto',
        padding: '0.5rem 1rem',
        background: 'rgba(0, 0, 0, 0.4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      {children}
    </div>
  );
}