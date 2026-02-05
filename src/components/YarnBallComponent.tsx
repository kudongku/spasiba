import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { YarnBall } from '@/game/entities/YarnBall';

interface YarnBallComponentProps {
  position: { x: number; z: number };
}

const YarnBallComponent = ({ position }: YarnBallComponentProps) => {
  const yarnRef = useRef<YarnBall | null>(null);
  const [yarnGroup, setYarnGroup] = useState<THREE.Group | null>(null);

  // 털실 엔티티 생성 (초기 위치는 0,0으로 시작하고 이후 setPosition으로 업데이트)
  useEffect(() => {
    const yarn = new YarnBall(0, 0);
    yarnRef.current = yarn;
    setYarnGroup(yarn.group);

    return () => {
      if (yarnRef.current) {
        yarnRef.current.destroy();
        yarnRef.current = null;
      }
      setYarnGroup(null);
    };
  }, []);

  // 위치 동기화
  useEffect(() => {
    if (yarnRef.current) {
      yarnRef.current.setPosition(position.x, position.z);
    }
  }, [position.x, position.z]);

  // 애니메이션 업데이트
  useFrame((_state, delta) => {
    if (yarnRef.current) {
      yarnRef.current.update(delta);
    }
  });

  if (!yarnGroup) return null;

  return <primitive object={yarnGroup} />;
};

export default YarnBallComponent;
