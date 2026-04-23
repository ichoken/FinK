// src/TitleScreen.tsx
import React from 'react';
import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';

export function TitleScreen({ startGame }: { startGame: () => void }) {
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

                <button
                    type="button"
                    onClick={startGame}
                    style={{
                        border: 'none',
                        padding: 0,
                        background: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                        }}
                    >
                        <img
                            src={mainBtnImage}
                            alt="Game start button"
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
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                                pointerEvents: 'none',
                            }}
                        >
                            Game start
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}