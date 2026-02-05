import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cat3DModel } from '@/game/entities/Cat3DModel';

// 고양이 상태 타입 정의
type CatState =
  | 'idle'
  | 'wander'
  | 'sit'
  | 'dragging'
  | 'following'
  | 'catching'
  | 'eating'
  | 'gallop'
  | 'playing'
  | 'resting';

// 사용할 모델 타입 선택
type CatType = Cat3DModel;

interface Cat3DComponentProps {
  onDragChange?: (isDragging: boolean) => void;
  onCatchingChange?: (isCatching: boolean) => void;
  yarnPosition?: { x: number; z: number } | null;
}

const Cat3DComponent = ({ onDragChange, onCatchingChange, yarnPosition }: Cat3DComponentProps) => {
  const catRef = useRef<CatType | null>(null);
  const [catGroup, setCatGroup] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const prevCatchingState = useRef<boolean>(false);
  const prevState = useRef<CatState | null>(null);

  // 모델 로딩
  useEffect(() => {
    let isMounted = true;

    const loadCat = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // 3D 모델 로드 시도
        const catModel = new Cat3DModel(0, 0, 20, 20);

        // 모델 파일 로드 (public 폴더의 파일)
        await catModel.loadModel('/models/Shiba%20Inu.glb');

        if (!isMounted) {
          catModel.destroy();
          return;
        }

        catRef.current = catModel;
        setCatGroup(catModel.group);
        setIsLoading(false);

        console.log('3D model loaded successfully');
        console.log('Available animations:', catModel.getAvailableAnimations());
      } catch (error) {
        console.error('Failed to load 3D model:', error);

        if (!isMounted) return;

        setIsLoading(false);
        setLoadError(error instanceof Error ? error.message : '모델 로딩 실패');
      }
    };

    loadCat();

    return () => {
      isMounted = false;
      if (catRef.current) {
        catRef.current.destroy();
        catRef.current = null;
      }
      setCatGroup(null);
    };
  }, []);

  // 화면 크기 업데이트
  useEffect(() => {
    if (catRef.current) {
      // Three.js 단위로 변환 (픽셀 → 월드 단위)
      const worldWidth = 20;
      const worldHeight = 20;
      catRef.current.updateScreenSize(worldWidth, worldHeight);
    }
  }, []);

  // 드래그 상태 변경 시 부모에게 알림
  useEffect(() => {
    if (onDragChange) {
      onDragChange(isDragging);
    }
  }, [isDragging, onDragChange]);

  // 털실 위치 추적
  useEffect(() => {
    if (!catRef.current || !yarnPosition || isDragging) {
      // 드래그 중이거나 털실이 없으면 following 비활성화
      if (catRef.current && !yarnPosition) {
        catRef.current.setFollowing(false);
      }
      return;
    }

    // catching 상태면 following 멈춤
    if (isCatching) {
      console.log('⏸️  Stopping follow - cat is catching');
      return;
    }

    // 털실 위치로 이동
    catRef.current.followTarget(yarnPosition.x, yarnPosition.z);
  }, [yarnPosition, isDragging, isCatching]);

  // 애니메이션 루프
  useFrame((_state, delta) => {
    if (catRef.current && !isLoading) {
      // Cat3DModel은 delta를 직접 사용
      catRef.current.update(delta);

      // 상태 변경 추적
      const currentState = catRef.current.getState();

      // 상태가 변경되었을 때 로그 출력
      if (currentState !== prevState.current) {
        console.log(`🐕 Cat state changed: ${prevState.current} → ${currentState}`);
        prevState.current = currentState;

        // 애니메이션 이모지로 상태 표시
        const stateEmoji: Record<CatState, string> = {
          idle: '🧍',
          wander: '🚶',
          sit: '🪑',
          dragging: '✋',
          following: '👀',
          catching: '🎯',
          eating: '🍽️',
          gallop: '🏃',
          playing: '⚔️',
          resting: '😴',
        };
        console.log(`${stateEmoji[currentState]} Current state: ${currentState}`);
      }

      // Catching 상태 체크 (기존 로직 유지)
      const currentIsCatching = currentState === 'catching';
      if (currentIsCatching !== prevCatchingState.current) {
        prevCatchingState.current = currentIsCatching;
        setIsCatching(currentIsCatching);
        if (onCatchingChange) {
          onCatchingChange(currentIsCatching);
        }
      }
    }
  });

  // 드래그 핸들러
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsDragging(true);

    if (catRef.current) {
      catRef.current.setDragging(true);

      // 드래그 평면 설정 (Y=0 평면)
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0)
      );

      // 초기 오프셋 계산
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(event.pointer, event.camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

      dragOffsetRef.current.copy(intersectPoint).sub(catRef.current.group.position);
    }
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !catRef.current) return;

    event.stopPropagation();

    // Raycasting으로 새 위치 계산
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(event.pointer, event.camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

    // 오프셋 적용
    const newPosition = intersectPoint.sub(dragOffsetRef.current);
    catRef.current.setPosition(newPosition.x, newPosition.z);
  };

  const handlePointerUp = () => {
    if (isDragging && catRef.current) {
      setIsDragging(false);
      catRef.current.setDragging(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    );
  }

  // 에러 발생 시
  if (loadError) {
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    );
  }

  if (!catGroup) return null;

  return (
    <primitive
      object={catGroup}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export default Cat3DComponent;
