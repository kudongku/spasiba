import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shiba3DModel } from '@/game/entities/Shiba3DModel';

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
  const shibaRef = useRef<Shiba3DModel | null>(null);
  const [shibaGroup, setShibaGroup] = useState<THREE.Group>(new THREE.Group());

  const [isDragging, setIsDragging] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const prevCatchingState = useRef<boolean>(false);

  // 모델 로딩
  useEffect(() => {
    let isMounted = true;

    const loadShiba = async () => {
      try {
        // 3D 모델 로드 시도
        const shibaModel = new Shiba3DModel(0, 0, 20, 20);

        // 모델 파일 로드 (public 폴더의 파일)
        await shibaModel.loadModel('/models/shiba-inu.glb');

        if (!isMounted) {
          shibaModel.destroy();
          return;
        }

        shibaRef.current = shibaModel;
        setShibaGroup(shibaModel.group);
      } catch (error) {
        console.error('Failed to load 3D model:', error);

        if (!isMounted) return;
      }
    };

    loadShiba();

    return () => {
      isMounted = false;
      if (shibaRef.current) {
        shibaRef.current.destroy();
        shibaRef.current = null;
      }
      setShibaGroup(new THREE.Group());
    };
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
      return;
    }

    // 테니스 공 위치로 이동
    shibaRef.current.followTarget(tennisPosition.x, tennisPosition.z);
  }, [tennisPosition, isDragging, isCatching]);

  // 애니메이션 루프
  useFrame((_state, delta) => {
    if (shibaRef.current) {
      shibaRef.current.update(delta);

      // Catching 상태 체크
      const currentState = shibaRef.current.getState();
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
