// src/MainLayout.tsx
import React from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 260px', // 左コンパクト、中央可変、右やや広め
        gap: '1rem',
        padding: '1rem',
        flexGrow: 1,
      }}
    >
      {children}
    </div>
  );
}