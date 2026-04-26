// src/GameScreen.tsx
import React, { useEffect } from 'react';
import titleImage from '/resource/title.jpg';

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
import { PlayerSelectModal } from './components/PlayerSelectModal'; // パスは構成に合わせて

import type { CardDefinition, GameState, PendingAction, Screen } from './types';
import type { PlayerInfo } from './gameConfig';
import { Modal } from './components/Modal';


type GameScreenProps = {
    players: PlayerInfo[];
    gameState: GameState;
    activePlayerIndex: number;
    selectedIndex: number | null;
    pendingAction: PendingAction | null;

    handleSelect: (index: number) => void;
    drawOne: () => void;
    debugDrawSpecific: (no: number) => void;
    debugEliminateActivePlayer: () => void;
    confirmUseSelected: () => void;

    setSelectedIndex: (i: number | null) => void;
    setActivePlayerIndex: (fn: (n: number) => number) => void;
    setScreen: React.Dispatch<React.SetStateAction<Screen>>;
    startGame: () => void;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    setPendingAction: (p: PendingAction | null) => void;
    setPlayers: React.Dispatch<React.SetStateAction<PlayerInfo[]>>;
    cards: CardDefinition[];

    actions: {
        resolveProphet: () => void;
        resolveFortuneTarget: (targetIndex: number) => void;
        finishFortune: () => void;
        resolveThiefTarget: (targetIndex: number) => void;
        resolveMagicianTarget: (targetIndex: number) => void;
        resolveHypnotistTarget: (targetIndex: number) => void;
        chooseMagicianSelfCard: (index: number) => void;
        chooseMagicianOpponentCard: (index: number) => void;
        chooseMagicianOpponentCardAuto: () => void;
        resolveMagicianSwap: () => void;
        resolveAngel: (discardIndex: number) => void;
        resolveConfusion: () => void;
        chooseSeizureTarget: (targetIndex: number) => void;
        resolveSeizure: (cardIndex: number) => void;
    };
};



export function GameScreen({
    players,
    gameState,
    activePlayerIndex,
    selectedIndex,
    pendingAction,

    // UI が使う関数（そのまま）
    handleSelect,
    drawOne,
    debugDrawSpecific,
    debugEliminateActivePlayer,
    confirmUseSelected,

    // state setter（そのまま）
    setSelectedIndex,
    setActivePlayerIndex,
    setScreen,
    startGame,
    setGameState,
    setPendingAction,
    setPlayers,
    cards,

    actions,

}: GameScreenProps) {
    useEffect(() => {
        if (!pendingAction) return;
        if (pendingAction.kind !== 'magician') return;

        // CPU の pendingAction は App.tsx 側で処理する（ここで自動実行しない）
        if (players[pendingAction.player]?.kind !== 'human') return;

        // player -> CPU のときは、CPU 側の交換候補カードをランダム選択して進める
        if (
            pendingAction.step === 'chooseOpponentCard' &&
            pendingAction.target !== undefined &&
            players[pendingAction.target]?.kind === 'cpu'
        ) {
            actions.chooseMagicianOpponentCardAuto();
            return;
        }

        // 交換処理は（人間発動時は）即実行でOK
        if (pendingAction.step === 'swap') {
            actions.resolveMagicianSwap();
            return;
        }
    }, [pendingAction]);


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
                                            onConfirm={actions.resolveProphet}
                                        />
                                    </div>
                                </div>
                            </ProphetPortal>
                        )}
                        {pendingAction?.kind === 'noTargetWarning' && (
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 200,
                                }}
                            >
                                <div
                                    style={{
                                        background: 'rgba(20,20,40,0.95)',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        width: 'min(500px, 90%)',
                                    }}
                                >
                                    <h3>対象者がいません</h3>
                                    <p>
                                        対象者がいない状態で使用すると、このカードは無効のまま破棄します。
                                        <br />
                                        それでもよろしいでしょうか？
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button
                                            onClick={() => {
                                                // No → キャンセル
                                                setPendingAction(null);
                                            }}
                                        >
                                            いいえ
                                        </button>

                                        <button
                                            onClick={() => {
                                                // Yes → カード破棄してターン終了
                                                // Yes のとき
                                                setGameState(prev => {
                                                    const nextHands = prev.hands.map(h => [...h]);
                                                    const idx = nextHands[pendingAction.player].findIndex(c => c.no === pendingAction.cardNo);
                                                    const [used] = nextHands[pendingAction.player].splice(idx, 1);

                                                    return {
                                                        ...prev,
                                                        hands: nextHands,
                                                        discard: [...prev.discard, used],
                                                        log: [...prev.log, `${players[pendingAction.player].name} は対象がいなかったため ${used.name} を破棄しました。`],
                                                    };
                                                });
                                                setPendingAction(null);
                                                setActivePlayerIndex((prev) => (prev + 1) % players.length);
                                            }}
                                        >
                                            はい
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 占い師：対象選択 UI（ロジックなし） */}
                        {pendingAction?.kind === 'fortune' &&
                            pendingAction.step === 'chooseTarget' && (
                                <PlayerSelectModal
                                    title="占い師：対象プレイヤーを選択"
                                    players={players
                                        .map((p, i) => ({ ...p, index: i }))
                                        .filter((p) => p.index !== activePlayerIndex && gameState.hands[p.index].length > 0)
                                    }
                                    onSelect={(idx) => actions.resolveFortuneTarget(idx)}
                                />
                            )
                        }

                        {/* 占い師：手札表示 UI（ロジックなし） */}
                        {pendingAction?.kind === 'fortune' && pendingAction.step === 'showHand' && pendingAction.target !== undefined && (
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
                                        onClick={actions.finishFortune} // ★ ロジックは App.tsx に集約
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        )}

                        {pendingAction?.kind === 'thief' &&
                            pendingAction.step === 'chooseTarget' && (
                                <PlayerSelectModal
                                    title="シーフ：対象プレイヤーを選択"
                                    players={players
                                        .map((p, i) => ({ ...p, index: i }))
                                        .filter((p) => p.index !== activePlayerIndex && gameState.hands[p.index].length > 0)
                                    }
                                    onSelect={(idx) => actions.resolveThiefTarget(idx)}
                                />
                            )
                        }
                        {/* 催眠術師：対象選択 UI（人間発動時のみ） */}
                        {pendingAction?.kind === 'hypnotist' &&
                            pendingAction.step === 'chooseTarget' && (
                                <PlayerSelectModal
                                    title="催眠術師：対象プレイヤーを選択"
                                    players={players
                                        .map((p, i) => ({ ...p, index: i }))
                                        .filter((p) => p.index !== pendingAction.player && gameState.hands[p.index].length > 0)
                                    }
                                    onSelect={(idx) => actions.resolveHypnotistTarget(idx)}
                                />
                            )}
                        {/* 手品師：対象選択 UI */}
                        {pendingAction?.kind === 'magician' &&
                            pendingAction.step === 'chooseTarget' && (
                                <PlayerSelectModal
                                    title="手品師：対象プレイヤーを選択"
                                    players={players
                                        .map((p, i) => ({ ...p, index: i }))
                                        // ★ activePlayerIndex ではなく pendingAction.player を使う
                                        .filter((p) => p.index !== pendingAction.player && gameState.hands[p.index].length > 0)
                                    }
                                    onSelect={(idx) => actions.resolveMagicianTarget(idx)}
                                />
                            )}

                        {/* 手品師：相手カード選択 UI（対象が human のときだけ表示） */}
                        {pendingAction?.kind === 'magician' &&
                            pendingAction.step === 'chooseOpponentCard' &&
                            pendingAction.target !== undefined &&
                            players[pendingAction.target].kind === 'human' && (
                                <div className="modal">
                                    <h3>手品師：相手の手札から交換するカードを選んでください</h3>

                                    <div className="hand-area">
                                        {gameState.hands[pendingAction.target].map((card, index) => (
                                            <button
                                                key={index}
                                                onClick={() => actions.chooseMagicianOpponentCard(index)}
                                                className="card-button"
                                            >
                                                {card.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {pendingAction?.kind === 'angel' && (
                            <div className="modal">
                                <h3>天使：墓地からカードを選択</h3>

                                <div className="discard-list">
                                    {gameState.discard.map((card, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => actions.resolveAngel(idx)}
                                            className="discard-card-button"
                                        >
                                            {card.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pendingAction?.kind === 'confusion' && (
                            <div className="modal">
                                <h3>混乱：{players[pendingAction.player].name} の手札</h3>

                                <div className="hand-cards">
                                    {gameState.hands[pendingAction.player].map((card, idx) => (
                                        <div key={idx} className="card-view">
                                            {card.name}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={actions.resolveConfusion}>OK</button>
                            </div>
                        )}
                        {pendingAction?.kind === 'seizure' && pendingAction.step === 'chooseTarget' && (
                            <Modal>
                                <h3>差し押さえ：対象プレイヤーを選択</h3>

                                {players.map((p, idx) => {
                                    if (idx === pendingAction.player) return null;
                                    if (gameState.hands[idx].length >= 4) return null; // 4枚以上は対象外

                                    return (
                                        <button key={idx} onClick={() => actions.chooseSeizureTarget(idx)}>
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </Modal>
                        )}
                        {pendingAction?.kind === 'seizure' && pendingAction.step === 'chooseCard' && (
                            <Modal>
                                <h3>差し押さえ：渡すカードを選択</h3>

                                {gameState.hands[pendingAction.player].map((card, idx) => (
                                    <button key={idx} onClick={() => actions.resolveSeizure(idx)}>
                                        {card.name}
                                    </button>
                                ))}
                            </Modal>
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
                                selectMode={
                                    pendingAction?.kind === 'merchant'
                                        ? 'merchant'
                                        : pendingAction?.kind === 'magician' &&
                                            pendingAction.step === 'chooseSelfCard'
                                            ? 'magician-self'
                                            : null
                                }
                                selectableIndexes={
                                    pendingAction?.kind === 'merchant'
                                        ? gameState.hands[activePlayerIndex].map((_, i) => i)
                                        : pendingAction?.kind === 'magician' &&
                                            pendingAction.step === 'chooseSelfCard'
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
                                商人の効果発動中: 山札の一番上に戻すカードを手札から１枚選択してください。
                            </div>
                        )}{pendingAction?.kind === 'magician' &&
                            pendingAction.step === 'chooseSelfCard' && (
                                <div
                                    style={{
                                        marginTop: '0.75rem',
                                        fontSize: '0.85rem',
                                        opacity: 0.9,
                                    }}
                                >
                                    手品師の効果発動中: 譲渡するカードを手札から１枚選択してください。
                                </div>
                            )}
                    </div>

                    {/* Right column */}
                    <div>
                        <DebugControls
                            cards={cards} // cards は App.tsx 側で渡してもOK
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
                gameState.hands[activePlayerIndex][selectedIndex] && (() => {

                    const card = gameState.hands[activePlayerIndex][selectedIndex];

                    // ★ 使用不可カードの判定（FinK / 黒魔術師 / シスター）
                    const isUnusableCard =
                        card.no === 12 ||          // FinK
                        card.no === 6 ||          // 黒魔術師
                        card.no === 7; // シスター（1〜4）

                    return (
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
                                    {card.name}
                                </h2>
                                <p
                                    style={{
                                        marginTop: 0,
                                        marginBottom: '0.5rem',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    効果: {card.effectSummary}
                                </p>
                                <p
                                    style={{
                                        marginTop: 0,
                                        marginBottom: '1rem',
                                        fontSize: '0.85rem',
                                        opacity: 0.9,
                                    }}
                                >
                                    {isUnusableCard
                                        ? "このカードは自ら使用できません。"
                                        : "このカードを使用すると、カードごとの効果を順次適用します。"}
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

                                    {/* ★ 使用不可カードは disable */}
                                    <button
                                        type="button"
                                        onClick={confirmUseSelected}
                                        disabled={isUnusableCard}
                                        style={{
                                            borderRadius: 999,
                                            border: '1px solid rgba(255, 255, 255, 0.8)',
                                            background: 'linear-gradient(135deg, #f97316, #fb923c, #fed7aa)',
                                            color: '#000',
                                            padding: '0.45rem 1.4rem',
                                            cursor: isUnusableCard ? 'not-allowed' : 'pointer',
                                            opacity: isUnusableCard ? 0.4 : 1,
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        Use this card
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

        </div>
    );
}