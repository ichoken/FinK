// src/MainLayout.tsx
import React from 'react';

export function MainLayout({
  children,
  singleColumn = false,
}: {
  children: React.ReactNode;
  singleColumn?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: singleColumn ? '1fr' : '200px 1fr 260px',
        gap: '1rem',
        padding: '1rem',
        flexGrow: 1,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}