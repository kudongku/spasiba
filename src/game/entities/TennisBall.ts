import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class TennisBall {
  public group: THREE.Group;
  private model: THREE.Group | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.loadModel(`${import.meta.env.BASE_URL}models/tennis-ball.glb`);
  }

  /**
   * GLTF 모델 로드 (테니스 공)
   */
  public async loadModel(modelPath: string): Promise<void> {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(modelPath);

      // 새 모델 추가
      this.model = gltf.scene;

      // 테니스 공 크기 조정 (적절한 마우스 포인터 크기)
      this.model.scale.set(3, 3, 3);
      this.group.add(this.model);
    } catch (error) {
      console.error('Failed to load Tennis ball model:', error);
    }
  }

  /**
   * 위치 업데이트
   */
  public setPosition(x: number, z: number): void {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  /**
   * 애니메이션 업데이트 (회전 효과)
   */
  public update(delta: number): void {
    if (!this.model) return;

    this.model.rotation.x += delta * 2;
    this.model.rotation.y += delta * 1.5;
  }

  /**
   * 리소스 정리 - GPU 메모리 누수 방지
   */
  public destroy(): void {
    if (!this.model) return;

    // Three.js 객체들을 메모리에서 완전히 제거
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Geometry 메모리 해제
        child.geometry?.dispose();

        // Material 메모리 해제
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.dispose();
          });
        } else {
          child.material?.dispose();
        }
      }
    });

    // Group에서 제거
    this.group.remove(this.model);
    this.model = null;
  }
}
