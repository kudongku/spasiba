import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MouseTrackerProps {
  onMouseMove: (worldPos: { x: number; z: number }) => void;
  enabled: boolean;
}

const MouseTracker = ({ onMouseMove, enabled }: MouseTrackerProps) => {
  const { camera, gl } = useThree();
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  useEffect(() => {
    if (!enabled) return;

    const handlePointerMove = (event: PointerEvent) => {
      // 캔버스 좌표를 NDC(Normalized Device Coordinates)로 변환
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting
      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersectPoint = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

      onMouseMove({
        x: intersectPoint.x,
        z: intersectPoint.z,
      });
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handlePointerMove);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [enabled, onMouseMove, camera, gl]);

  return null;
};

export default MouseTracker;
