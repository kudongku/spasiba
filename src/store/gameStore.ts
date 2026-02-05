import { create } from 'zustand';

interface GameStore {
  isTennisBallCursor: boolean;
  setTennisBallCursor: (value: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isTennisBallCursor: false,
  setTennisBallCursor: (value) => set({ isTennisBallCursor: value }),
}));
