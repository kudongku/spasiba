import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback, useState } from 'react';
import MouseTracker from '@/components/MouseTracker';
import Shiba3DComponent from '@/components/Shiba3DComponent';
import TennisBallComponent from '@/components/TennisBallComponent';
import { useGameStore } from '@/store/gameStore';

// 스타일 설정
const GROUND_COLOR = '#7cb342'; // 초원색
const GROUND_OPACITY = 0.8;

const ThreeCanvas = () => {
  const { isTennisBallCursor, setTennisBallCursor } = useGameStore();
  const [isDraggingShiba, setIsDraggingShiba] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; z: number } | null>(null);
  const [showTennis, setShowTennis] = useState(true);

  const handleMouseMove = useCallback(
    (worldPos: { x: number; z: number }) => {
      // 커서가 활성화된 경우에만 마우스 위치 추적
      if (!isTennisBallCursor) return;

      setMouseWorldPos(worldPos);
      // 마우스 움직이면 테니스 공 다시 표시
      if (!showTennis) {
        setShowTennis(true);
      }
      // catching 상태 해제
      if (isCatching) {
        setIsCatching(false);
      }
    },
    [isTennisBallCursor, showTennis, isCatching]
  );

  const handleCatchingChange = useCallback(
    (catching: boolean) => {
      setIsCatching(catching);
      // catching 시작되면 테니스 공 숨김 및 커서 상태 해제
      if (catching) {
        setShowTennis(false);
        setTennisBallCursor(false);
      }
    },
    [setTennisBallCursor]
  );

  return (
    <div
      className={isTennisBallCursor ? 'tennis-ball-cursor' : ''}
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas camera={{ position: [0, 8, 12], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#87CEEB']} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.3} />

        {/* 마우스 추적 */}
        <MouseTracker onMouseMove={handleMouseMove} enabled={!isDraggingShiba} />

        {/* 테니스 공 - showTennis가 true일 때만 표시 */}
        {mouseWorldPos && showTennis && <TennisBallComponent position={mouseWorldPos} />}

        {/* 시바견 - 커서 활성화 시에만 테니스공 추적 */}
        <Shiba3DComponent
          onDragChange={setIsDraggingShiba}
          onCatchingChange={handleCatchingChange}
          tennisPosition={isTennisBallCursor ? mouseWorldPos : null}
        />

        {/* 바닥 평면 (참조용, 나중에 제거 가능) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color={GROUND_COLOR} opacity={GROUND_OPACITY} transparent />
        </mesh>

        {/* 카메라 컨트롤 - 줌만 가능, 회전/이동 비활성화 */}
        <OrbitControls
          enabled={!isDraggingShiba}
          enableRotate={false}
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
};

export default ThreeCanvas;
