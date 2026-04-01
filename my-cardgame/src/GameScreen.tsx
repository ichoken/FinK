// src/GameScreen.tsx
import React from 'react';
import titleImage from '../resource/title.jpg';

import { Header } from './Header';
import { MainLayout } from './MainLayout';
import { DeckView } from './DeckView';
import { DiscardView } from './DiscardView';
import { PlayerListView } from './PlayerListView';
import { HandView } from './HandView';
import { DebugControls } from './DebugControls';
import { BottomLogArea } from './BottomLogArea';
import { LogView } from './LogView';
import { ProphetPortal } from './ProphetPortal';
import { ProphetView } from './ProphetView';

export function GameScreen({
    players,
    gameState,
    activePlayerIndex,
    selectedIndex,
    pendingAction,

    // UI が使う関数
    handleSelect,
    drawOne,
    debugDrawSpecific,
    debugEliminateActivePlayer,
    resolveProphet,
    confirmUseSelected,

    // state setter
    setSelectedIndex,
    setActivePlayerIndex,
    setScreen,
    startGame,
    setGameState,
    setPendingAction,
}) {
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
            {/* ★ 勝利画面 */}
            {gameState.gameOver && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 99999,
                        color: '#fff',
                        textShadow: '0 3px 10px rgba(0,0,0,0.8)',
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
                        {gameState.winners.length === 0
                            ? '引き分け！'
                            : `勝者: ${gameState.winners.map((i) => players[i].name).join('、')}`}
                    </div>

                    <button
                        onClick={startGame}
                        style={{
                            padding: '0.8rem 2rem',
                            fontSize: '1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #f97316, #fb923c, #fed7aa)',
                            color: '#000',
                            fontWeight: 700,
                        }}
                    >
                        リスタート
                    </button>
                </div>
            )}

            {/* Header */}
            <Header
                players={players}
                activePlayerIndex={activePlayerIndex}
                onBackToTitle={() => setScreen('title')}
            />

            {/* MainLayout */}
            <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
                <MainLayout>
                    {/* Left column */}
                    <div>
                        <DeckView deck={gameState.deck} />
                        <DiscardView
                            discard={gameState.discard}
                            lastDiscard={
                                gameState.discard.length > 0
                                    ? gameState.discard[gameState.discard.length - 1]
                                    : null
                            }
                        />
                        <PlayerListView
                            players={players}
                            activePlayerIndex={activePlayerIndex}
                            hands={gameState.hands}
                        />
                    </div>

                    {/* Center column */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            height: '100%',
                            minHeight: 0,
                            flex: 1,
                        }}
                    >
                        {/* Prophet */}
                        {pendingAction?.kind === 'prophet' && (
                            <ProphetPortal>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-5%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 50,
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            pointerEvents: 'auto',
                                            width: 'min(1000px, 90%)',
                                        }}
                                    >
                                        <ProphetView
                                            cards={pendingAction.cards}
                                            onReorder={(newOrder) => {
                                                setPendingAction({
                                                    ...pendingAction,
                                                    cards: newOrder,
                                                });
                                            }}
                                            onConfirm={resolveProphet}
                                        />
                                    </div>
                                </div>
                            </ProphetPortal>
                        )}

                        {/* Hand */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '4%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                pointerEvents: 'auto',
                            }}
                        >
                            <HandView
                                hand={gameState.hands[activePlayerIndex]}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelect}
                                onDraw={drawOne}
                                selectMode={pendingAction?.kind ?? null}
                                selectableIndexes={
                                    pendingAction?.kind === 'merchant'
                                        ? gameState.hands[activePlayerIndex].map((_, i) => i)
                                        : []
                                }
                            />
                        </div>

                        {pendingAction?.kind === 'merchant' && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.9,
                                }}
                            >
                                商人の効果発動中: 山札の一番上に戻すカードを手札から1枚選んでください。
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div>
                        <DebugControls
                            cards={[]} // cards は App.tsx 側で渡してもOK
                            handLength={gameState.hands[activePlayerIndex].length}
                            deck={gameState.deck}
                            onDebugDraw={debugDrawSpecific}
                            onNextPlayer={() => {
                                setActivePlayerIndex((prev) => (prev + 1) % players.length);
                                setSelectedIndex(null);
                            }}
                            onDebugEliminate={debugEliminateActivePlayer}
                            players={players}
                            activePlayerIndex={activePlayerIndex}
                        />
                    </div>
                </MainLayout>
            </div>

            {/* Bottom log */}
            <BottomLogArea>
                <LogView
                    log={gameState.log}
                    onClear={() =>
                        setGameState((prev) => ({ ...prev, log: [] }))
                    }
                />
            </BottomLogArea>

            {/* カード詳細モーダル */}
            {selectedIndex !== null &&
                gameState.hands[activePlayerIndex][selectedIndex] && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: 'rgba(10, 10, 25, 0.95)',
                                borderRadius: 16,
                                padding: '1.5rem 2rem',
                                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)',
                                maxWidth: 600,
                                width: '90%',
                            }}
                        >
                            <h2
                                style={{
                                    marginTop: 0,
                                    marginBottom: '0.75rem',
                                    fontSize: '1.4rem',
                                }}
                            >
                                {gameState.hands[activePlayerIndex][selectedIndex].name}
                            </h2>
                            <p
                                style={{
                                    marginTop: 0,
                                    marginBottom: '0.5rem',
                                    fontSize: '0.95rem',
                                }}
                            >
                                効果: {gameState.hands[activePlayerIndex][selectedIndex].effectSummary}
                            </p>
                            <p
                                style={{
                                    marginTop: 0,
                                    marginBottom: '1rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.9,
                                }}
                            >
                                このカードを使用すると、カードごとの効果を順次適用します。
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '0.75rem',
                                    marginTop: '0.5rem',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedIndex(null)}
                                    style={{
                                        borderRadius: 999,
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        color: '#fff',
                                        padding: '0.45rem 1.1rem',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmUseSelected}
                                    style={{
                                        borderRadius: 999,
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        background: 'linear-gradient(135deg, #f97316, #fb923c, #fed7aa)',
                                        color: '#000',
                                        padding: '0.45rem 1.4rem',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    Use this card
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}