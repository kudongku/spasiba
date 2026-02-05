import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class YarnBall {
  public group: THREE.Group;
  private mesh: THREE.Mesh | null = null;
  private model: THREE.Group | null = null;

  constructor(x: number, z: number) {
    this.group = new THREE.Group();

    // 초기 위치
    this.group.position.set(x, 0.5, z);

    // 기본 구체 메시 생성 (테니스 공 모델 로드 전)
    this.createDefaultMesh();

    // 테니스 공 모델 자동 로드
    this.loadModel('/models/Tennis ball.glb');
  }

  /**
   * 기본 구체 메시 생성 (테니스 공 모델 로드 전 임시 표시)
   */
  private createDefaultMesh(): void {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: '#ccff00', // 테니스 공 색상 (형광 노란색)
      roughness: 0.7,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.group.add(this.mesh);

    // 약간의 회전 애니메이션을 위한 준비
    this.mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
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

      // 그림자 설정
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.group.add(this.model);

      console.log('Tennis ball model loaded successfully');

      // 모델 로드 성공 후 기존 메시 제거
      if (this.mesh) {
        this.group.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.mesh = null;
      }
    } catch (error) {
      console.error('Failed to load Tennis ball model:', error);
      console.error('Falling back to default mesh');
      // 실패 시 기본 메시 유지 (이미 생성되어 있음)
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
    // 테니스 공이 굴러가는 효과
    if (this.mesh) {
      this.mesh.rotation.x += delta * 2;
      this.mesh.rotation.y += delta * 1.5;
    }

    // 3D 모델이 로드된 경우에도 회전 효과 적용
    if (this.model) {
      this.model.rotation.x += delta * 2;
      this.model.rotation.y += delta * 1.5;
    }
  }

  /**
   * 리소스 정리
   */
  public destroy(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.group.remove(this.mesh);
      this.mesh = null;
    }

    if (this.model) {
      this.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.dispose();
            });
          } else {
            child.material.dispose();
          }
        }
      });
      this.group.remove(this.model);
      this.model = null;
    }
  }
}
