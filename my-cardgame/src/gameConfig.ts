export const PLAYER_COUNT = 4;
export const HUMAN_PLAYER_INDEX = 0;

export type PlayerKind = 'human' | 'cpu';

export interface PlayerInfo {
  id: number;
  name: string;
  kind: PlayerKind;
  isEliminated: boolean;
}

export function createDefaultPlayers(): PlayerInfo[] {
  return [
    { id: 0, name: 'You', kind: 'human',isEliminated:false },
    { id: 1, name: 'CPU 1', kind: 'cpu' ,isEliminated:false},
    { id: 2, name: 'CPU 2', kind: 'cpu' ,isEliminated:false},
    { id: 3, name: 'CPU 3', kind: 'cpu' ,isEliminated:false},
  ];
}

