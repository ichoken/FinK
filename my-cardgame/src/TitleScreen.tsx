import React from 'react';
import titleImage from '/resource/title.jpg';
import mainBtnImage from '/resource/mainBtn.png';
import type { GameMode } from './types';

type Props = {
  startGame: (mode: GameMode) => void;
};

function StartButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        padding: 0,
        background: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={mainBtnImage}
          alt=""
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffffff',
            fontSize: '1.25rem',
            fontWeight: 700,
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

export function TitleScreen({ startGame }: Props) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${titleImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#ffffff',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            letterSpacing: '0.2em',
          }}
        >
          FinK
        </h1>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          <StartButton label="ゲーム開始" onClick={() => startGame('game')} />
          <StartButton label="デバッグモード" onClick={() => startGame('debug')} />
        </div>
      </div>
    </div>
  );
}
