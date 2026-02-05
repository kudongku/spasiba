import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import Cat3DComponent from '@/components/Cat3DComponent';

const ThreeCanvas = () => {
  const [isDraggingCat, setIsDraggingCat] = useState(false);

  return (
    <Canvas camera={{ position: [0, 8, 12], fov: 50 }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#f5f5f5']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />

      <Cat3DComponent onDragChange={setIsDraggingCat} />

      {/* 바닥 평면 (참조용, 나중에 제거 가능) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>

      {/* 카메라 컨트롤 - 줌만 가능, 회전/이동 비활성화 */}
      <OrbitControls
        enabled={!isDraggingCat}
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
