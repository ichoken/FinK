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
import { trySisterDefense } from './utils/sisterDefense';

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
                        {pendingAction?.kind === 'fortune' && pendingAction.step === 'chooseTarget' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 50,
                                    background: 'rgba(0,0,0,0.8)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                }}
                            >
                                <h3>占い師：対象プレイヤーを選択</h3>
                                {players.map((p, i) =>
                                    i !== activePlayerIndex &&
                                        gameState.hands[i].length > 0 ? (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setGameState(prev => ({
                                                    ...prev,
                                                    log: [
                                                        ...prev.log,
                                                        `${players[activePlayerIndex].name} が ${players[i].name} に対して占い師を発動しました。`,
                                                    ],
                                                }));

                                                // シスターがある場合 → シスター破棄して終了
                                                const defended = trySisterDefense(
                                                    i,               // 対象プレイヤー
                                                    gameState,
                                                    players,
                                                    setGameState
                                                );

                                                if (defended) {
                                                    // シスターが発動したのでターン終了
                                                    setPendingAction(null);
                                                    setActivePlayerIndex((prev) => (prev + 1) % players.length);
                                                    return;
                                                }

                                                // シスターがない → 手札公開フェーズへ
                                                setPendingAction({
                                                    kind: 'fortune',
                                                    player: activePlayerIndex,
                                                    step: 'showHand',
                                                    target: i,
                                                });
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ) : null
                                )}
                            </div>
                        )}
                        {pendingAction?.kind === 'fortune' &&
                            pendingAction.step === 'showHand' && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 100,
                                    }}
                                >
                                    <div
                                        style={{
                                            background: 'rgba(20,20,40,0.95)',
                                            padding: '1.5rem',
                                            borderRadius: '12px',
                                            width: 'min(600px, 90%)',
                                        }}
                                    >
                                        <h3>{players[pendingAction.target].name} の手札</h3>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            {gameState.hands[pendingAction.target].map((c, idx) => (
                                                <div key={idx} style={{ textAlign: 'center' }}>
                                                    <img
                                                        src={c.image}
                                                        alt={c.name}
                                                        style={{ width: '80px', borderRadius: '6px' }}
                                                    />
                                                    <div>{c.name}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            style={{ marginTop: '1.5rem' }}
                                            onClick={() => {
                                                setPendingAction(null);
                                                setActivePlayerIndex((prev) => (prev + 1) % players.length);
                                            }}
                                        >
                                            閉じる
                                        </button>
                                    </div>
                                </div>
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