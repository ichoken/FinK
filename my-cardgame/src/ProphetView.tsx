// ProphetView.tsx — 置き換え用（そのままファイルを差し替えてください）
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { CardDefinition } from './cards';
import { CardView } from './CardView';

type ProphetViewProps = {
    cards: CardDefinition[];
    onReorder: (newOrder: CardDefinition[]) => void;
    onConfirm: () => void;
};

export function ProphetView({ cards, onReorder, onConfirm }: ProphetViewProps) {
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        const newCards = Array.from(cards);
        const [moved] = newCards.splice(result.source.index, 1);
        newCards.splice(result.destination.index, 0, moved);
        onReorder(newCards);
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <h3 style={{ textAlign: 'center' }}>預言者：カードを並び替えてください</h3>

            <DragDropContext
                onDragStart={(start) => {
                    console.log('dnd start', start);
                    // 少し遅延して要素が描画された後に取得
                    setTimeout(() => {
                        const el = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`)
                            || document.querySelector(`[draggableid="${start.draggableId}"]`);
                        if (el) {
                            console.log('computed style', window.getComputedStyle(el));
                            // 祖先も列挙
                            let p: HTMLElement | null = el as HTMLElement;
                            while (p) {
                                console.log('ancestor', p.tagName, window.getComputedStyle(p).transform, window.getComputedStyle(p).willChange, window.getComputedStyle(p).filter);
                                p = p.parentElement;
                            }
                        } else {
                            console.log('element not found for', start.draggableId);
                        }
                    }, 50);
                }}

                onDragUpdate={(update) => {
                    console.log('dnd update', update);
                }}
                onDragEnd={handleDragEnd}
            >
                <Droppable droppableId="prophet-cards" direction="horizontal">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'center',
                                padding: '1rem',
                            }}
                        >
                            {cards.map((card, index) => (
                                <Draggable key={`${card.no}-${index}`} draggableId={`${card.no}-${index}`} index={index}>
                                    {(draggableProvided, snapshot) => {
                                        // ライブラリが渡す style を最後にマージする（これが最重要）
                                        const combinedStyle: React.CSSProperties = {
                                            display: 'inline-block',
                                            userSelect: 'none',
                                            touchAction: 'none',
                                            // ドラッグ中は前面に出す
                                            zIndex: snapshot.isDragging ? 1000 : undefined,
                                            // ブラウザに transform を最適化させるヒント
                                            willChange: snapshot.isDragging ? 'transform' : undefined,
                                            transformOrigin: 'center center',
                                            backfaceVisibility: 'hidden',

                                            // ライブラリの style を最後に展開して transform/position を優先させる
                                            ...draggableProvided.draggableProps.style,
                                        };

                                        return (
                                            <div
                                                ref={draggableProvided.innerRef}
                                                {...draggableProvided.draggableProps}
                                                {...draggableProvided.dragHandleProps}
                                                style={combinedStyle}
                                            >
                                                <CardView card={card} onClick={() => { }} highlight={true} isDragging={snapshot.isDragging} />



                                            </div>
                                        );
                                    }}
                                </Draggable>
                            ))}

                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={onConfirm}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
}