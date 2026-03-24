import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { CardDefinition } from './cards';
import { CardView } from './CardView';

type ProphetViewProps = {
    cards: CardDefinition[];
    onReorder: (newOrder: CardDefinition[]) => void;
    onConfirm: () => void; // ← 追加
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
            <h3>預言者：カードを並び替えてください</h3>

            <DragDropContext onDragEnd={handleDragEnd}>
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
                                <Draggable
                                    key={`${card.no}-${index}`}
                                    draggableId={`${card.no}-${index}`}
                                    index={index}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <CardView
                                                card={card}
                                                onClick={() => { }}
                                                highlight={true}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}

                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* ★ 決定ボタン */}
            <button
                onClick={onConfirm}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                }}
            >
                OK
            </button>
        </div>
    );
}