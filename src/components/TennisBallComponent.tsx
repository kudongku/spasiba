import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { TennisBall } from '@/game/entities/TennisBall';

interface TennisBallComponentProps {
  position: { x: number; z: number };
}

const TennisBallComponent = ({ position }: TennisBallComponentProps) => {
  const tennisRef = useRef<TennisBall | null>(null);
  const [tennisGroup, setTennisGroup] = useState<THREE.Group | null>(null);

  // 테니스 공 엔티티 생성 (초기 위치는 0,0으로 시작하고 이후 setPosition으로 업데이트)
  useEffect(() => {
    const tennis = new TennisBall(0, 0);
    tennisRef.current = tennis;
    setTennisGroup(tennis.group);

    return () => {
      if (tennisRef.current) {
        tennisRef.current.destroy();
        tennisRef.current = null;
      }
      setTennisGroup(null);
    };
  }, []);

  // 위치 동기화
  useEffect(() => {
    if (tennisRef.current) {
      tennisRef.current.setPosition(position.x, position.z);
    }
  }, [position.x, position.z]);

  // 애니메이션 업데이트
  useFrame((_state, delta) => {
    if (tennisRef.current) {
      tennisRef.current.update(delta);
    }
  });

  if (!tennisGroup) return null;

  return <primitive object={tennisGroup} />;
};

export default TennisBallComponent;
