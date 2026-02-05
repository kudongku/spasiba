import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import MouseTracker from '@/components/MouseTracker';
import Shiba3DComponent from '@/components/Shiba3DComponent';
import TennisBallComponent from '@/components/TennisBallComponent';

// 스타일 설정
const GROUND_COLOR = '#7cb342'; // 초원색
const GROUND_OPACITY = 0.8;

const ThreeCanvas = () => {
  const [isDraggingShiba, setIsDraggingShiba] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; z: number } | null>(null);
  const [showTennis, setShowTennis] = useState(true);

  const handleMouseMove = (worldPos: { x: number; z: number }) => {
    setMouseWorldPos(worldPos);
    // 마우스 움직이면 테니스 공 다시 표시
    if (!showTennis) {
      setShowTennis(true);
    }
    // catching 상태 해제
    if (isCatching) {
      setIsCatching(false);
    }
  };

  const handleCatchingChange = (catching: boolean) => {
    console.log('Catching state changed:', catching);
    setIsCatching(catching);
    // catching 시작되면 테니스 공 숨김
    if (catching) {
      setShowTennis(false);
    }
  };

  return (
    <Canvas camera={{ position: [0, 8, 12], fov: 50 }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#f5f5f5']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />

      {/* 마우스 추적 */}
      <MouseTracker onMouseMove={handleMouseMove} enabled={!isDraggingShiba} />

      {/* 테니스 공 - showTennis가 true일 때만 표시 */}
      {mouseWorldPos && showTennis && <TennisBallComponent position={mouseWorldPos} />}

      {/* 시바견 */}
      <Shiba3DComponent
        onDragChange={setIsDraggingShiba}
        onCatchingChange={handleCatchingChange}
        tennisPosition={mouseWorldPos}
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
  );
};

export default ThreeCanvas;
