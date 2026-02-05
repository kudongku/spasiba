import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shiba3DModel } from '@/game/entities/Shiba3DModel';

// 시바견 상태 타입 정의
type ShibaState =
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
type ShibaType = Shiba3DModel;

interface Shiba3DComponentProps {
  onDragChange?: (isDragging: boolean) => void;
  onCatchingChange?: (isCatching: boolean) => void;
  tennisPosition?: { x: number; z: number } | null;
}

const Shiba3DComponent = ({
  onDragChange,
  onCatchingChange,
  tennisPosition,
}: Shiba3DComponentProps) => {
  const shibaRef = useRef<ShibaType | null>(null);
  const [shibaGroup, setShibaGroup] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const prevCatchingState = useRef<boolean>(false);
  const prevState = useRef<ShibaState | null>(null);

  // 모델 로딩
  useEffect(() => {
    let isMounted = true;

    const loadShiba = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // 3D 모델 로드 시도
        const shibaModel = new Shiba3DModel(0, 0, 20, 20);

        // 모델 파일 로드 (public 폴더의 파일)
        await shibaModel.loadModel('/models/Shiba%20Inu.glb');

        if (!isMounted) {
          shibaModel.destroy();
          return;
        }

        shibaRef.current = shibaModel;
        setShibaGroup(shibaModel.group);
        setIsLoading(false);

        console.log('3D model loaded successfully');
        console.log('Available animations:', shibaModel.getAvailableAnimations());
      } catch (error) {
        console.error('Failed to load 3D model:', error);

        if (!isMounted) return;

        setIsLoading(false);
        setLoadError(error instanceof Error ? error.message : '모델 로딩 실패');
      }
    };

    loadShiba();

    return () => {
      isMounted = false;
      if (shibaRef.current) {
        shibaRef.current.destroy();
        shibaRef.current = null;
      }
      setShibaGroup(null);
    };
  }, []);

  // 화면 크기 업데이트
  useEffect(() => {
    if (shibaRef.current) {
      // Three.js 단위로 변환 (픽셀 → 월드 단위)
      const worldWidth = 20;
      const worldHeight = 20;
      shibaRef.current.updateScreenSize(worldWidth, worldHeight);
    }
  }, []);

  // 드래그 상태 변경 시 부모에게 알림
  useEffect(() => {
    if (onDragChange) {
      onDragChange(isDragging);
    }
  }, [isDragging, onDragChange]);

  // 테니스 공 위치 추적
  useEffect(() => {
    if (!shibaRef.current || !tennisPosition || isDragging) {
      // 드래그 중이거나 테니스 공이 없으면 following 비활성화
      if (shibaRef.current && !tennisPosition) {
        shibaRef.current.setFollowing(false);
      }
      return;
    }

    // catching 상태면 following 멈춤
    if (isCatching) {
      console.log('⏸️  Stopping follow - shiba is catching');
      return;
    }

    // 테니스 공 위치로 이동
    shibaRef.current.followTarget(tennisPosition.x, tennisPosition.z);
  }, [tennisPosition, isDragging, isCatching]);

  // 애니메이션 루프
  useFrame((_state, delta) => {
    if (shibaRef.current && !isLoading) {
      // Shiba3DModel은 delta를 직접 사용
      shibaRef.current.update(delta);

      // 상태 변경 추적
      const currentState = shibaRef.current.getState();

      // 상태가 변경되었을 때 로그 출력
      if (currentState !== prevState.current) {
        console.log(`🐕 Shiba state changed: ${prevState.current} → ${currentState}`);
        prevState.current = currentState;

        // 애니메이션 이모지로 상태 표시
        const stateEmoji: Record<ShibaState, string> = {
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

    if (shibaRef.current) {
      shibaRef.current.setDragging(true);

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

      dragOffsetRef.current.copy(intersectPoint).sub(shibaRef.current.group.position);
    }
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !shibaRef.current) return;

    event.stopPropagation();

    // Raycasting으로 새 위치 계산
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(event.pointer, event.camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

    // 오프셋 적용
    const newPosition = intersectPoint.sub(dragOffsetRef.current);
    shibaRef.current.setPosition(newPosition.x, newPosition.z);
  };

  const handlePointerUp = () => {
    if (isDragging && shibaRef.current) {
      setIsDragging(false);
      shibaRef.current.setDragging(false);
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

  if (!shibaGroup) return null;

  return (
    <primitive
      object={shibaGroup}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export default Shiba3DComponent;
