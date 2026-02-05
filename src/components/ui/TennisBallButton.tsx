import { useGameStore } from '@/store/gameStore';

const TennisBallButton = () => {
  const { isTennisBallCursor, setTennisBallCursor } = useGameStore();

  const handleClick = () => {
    setTennisBallCursor(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTennisBallCursor}
      className={`
        fixed bottom-8 left-1/2 -translate-x-1/2
        w-20 h-20 rounded-full
        bg-gradient-to-br from-blue-400 to-blue-600
        shadow-lg hover:shadow-xl
        transition-all duration-200
        flex items-center justify-center
        text-4xl
        ${isTennisBallCursor ? 'opacity-50 cursor-not-allowed scale-90' : 'hover:scale-110 active:scale-95'}
      `}
      aria-label="테니스공 커서 활성화"
    >
      🎾
    </button>
  );
};

export default TennisBallButton;
