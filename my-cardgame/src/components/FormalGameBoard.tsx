import type { CardDefinition } from '../cards';
import type { PlayerInfo } from '../gameConfig';
import { OpponentHandView } from './OpponentHandView';
import { StackedDeckView } from './StackedDeckView';
import { StackedDiscardView } from './StackedDiscardView';

type Props = {
  players: PlayerInfo[];
  activePlayerIndex: number;
  hands: CardDefinition[][];
  deckCount: number;
  discard: CardDefinition[];
};

const OPPONENT_LAYOUT: Array<{ playerIndex: number; align: 'left' | 'center' | 'right' }> = [
  { playerIndex: 1, align: 'left' },
  { playerIndex: 2, align: 'center' },
  { playerIndex: 3, align: 'right' },
];

export function FormalGameBoard({
  players,
  activePlayerIndex,
  hands,
  deckCount,
  discard,
}: Props) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: 0,
          right: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '0 1.5rem',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {OPPONENT_LAYOUT.map(({ playerIndex, align }) => (
          <OpponentHandView
            key={playerIndex}
            player={players[playerIndex]}
            handCount={hands[playerIndex]?.length ?? 0}
            isActive={activePlayerIndex === playerIndex}
            align={align}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2.5rem',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        <StackedDeckView deckCount={deckCount} />
        <StackedDiscardView discard={discard} />
      </div>
    </>
  );
}
