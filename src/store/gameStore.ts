import { create } from 'zustand';

interface GameStore {
  // 커서 상태
  isTennisBallCursor: boolean;
  setTennisBallCursor: (value: boolean) => void;

  // 마우스 위치
  mouseWorldPos: { x: number; z: number } | null;
  setMouseWorldPos: (pos: { x: number; z: number } | null) => void;

  // 시바 드래그 상태
  isDraggingShiba: boolean;
  setIsDraggingShiba: (value: boolean) => void;

  // Catching 상태
  isCatching: boolean;
  setIsCatching: (value: boolean) => void;

  // 테니스공 표시 상태
  showTennis: boolean;
  setShowTennis: (value: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // 커서 상태
  isTennisBallCursor: false,
  setTennisBallCursor: (value) => set({ isTennisBallCursor: value }),

  // 마우스 위치
  mouseWorldPos: null,
  setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),

  // 시바 드래그 상태
  isDraggingShiba: false,
  setIsDraggingShiba: (value) => set({ isDraggingShiba: value }),

  // Catching 상태
  isCatching: false,
  setIsCatching: (value) => set({ isCatching: value }),

  // 테니스공 표시 상태
  showTennis: true,
  setShowTennis: (value) => set({ showTennis: value }),
}));
