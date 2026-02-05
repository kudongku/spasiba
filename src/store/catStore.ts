import { create } from 'zustand';

export type CatState = 'idle' | 'walking' | 'dragging';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface CatStore {
  position: Position;
  velocity: Velocity;
  state: CatState;
  isDragging: boolean;
  setPosition: (x: number, y: number) => void;
  setVelocity: (x: number, y: number) => void;
  setState: (state: CatState) => void;
  startDragging: () => void;
  stopDragging: () => void;
}

export const useCatStore = create<CatStore>((set) => ({
  position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  velocity: { x: 0, y: 0 },
  state: 'idle',
  isDragging: false,
  setPosition: (x: number, y: number) => set({ position: { x, y } }),
  setVelocity: (x: number, y: number) => set({ velocity: { x, y } }),
  setState: (state: CatState) => set({ state }),
  startDragging: () => set({ isDragging: true, state: 'dragging' }),
  stopDragging: () => set({ isDragging: false, state: 'walking' }),
}));
