import { gsap } from 'gsap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Shiba3DModel {
  public group: THREE.Group;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAnimation: THREE.AnimationAction | null = null;

  private velocity: { x: number; z: number };
  private isDragging: boolean;
  private screenWidth: number;
  private screenHeight: number;
  private state:
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
  private stateTimer: number;
  private stateDuration: number;
  private targetPosition: { x: number; z: number } | null;
  private gsapTween: gsap.core.Tween | null;
  private isModelLoaded: boolean;
  private isFollowing: boolean;
  private catchingTimer: number;

  // 로딩 상태
  public isLoading: boolean;
  public loadError: string | null;

  constructor(x: number, z: number, screenWidth: number, screenHeight: number) {
    this.group = new THREE.Group();
    this.velocity = { x: 0, z: 0 };
    this.isDragging = false;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // FSM 초기화
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.targetPosition = null;
    this.gsapTween = null;
    this.isModelLoaded = false;
    this.isFollowing = false;
    this.catchingTimer = 0;

    // 로딩 상태
    this.isLoading = true;
    this.loadError = null;

    // 초기 위치
    this.group.position.set(x, 0, z);
  }

  /**
   * GLTF 모델 로드 (비동기)
   */
  public async loadModel(modelPath: string): Promise<void> {
    try {
      this.isLoading = true;
      this.loadError = null;

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(modelPath);

      // 모델을 그룹에 추가
      this.model = gltf.scene;

      // 모델 바운딩 박스 계산 (디버깅용)
      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      console.log('Model size:', size);
      console.log('Model center:', center);
      console.log('Model children count:', this.model.children.length);

      // 모델 스케일 조정 (Shiba Inu 모델용 - 크기 증가)
      this.model.scale.set(1, 1, 1);

      // 모델 위치 조정 (바닥에 맞춤 - 센터를 기준으로)
      this.model.position.y = -center.y;

      this.group.add(this.model);

      // 애니메이션 믹서 초기화
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);

        // 애니메이션 클립 매핑
        for (const clip of gltf.animations) {
          const action = this.mixer.clipAction(clip);
          const normalizedName = this.normalizeAnimationName(clip.name);
          this.animations.set(normalizedName, action);

          console.log(`Animation loaded: ${clip.name} -> ${normalizedName}`);
        }

        // 기본 애니메이션 시작 (idle)
        this.playAnimation('idle');
      } else {
        console.warn('No animations found in the model');
      }

      this.isModelLoaded = true;
      this.isLoading = false;

      // 초기 상태 시작
      this.transitionToNextState();

      console.log('Model loaded successfully');
    } catch (error) {
      this.isLoading = false;
      this.loadError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load model:', error);
      throw error;
    }
  }

  /**
   * 애니메이션 이름 정규화 (대소문자 무시, 공백 제거)
   */
  private normalizeAnimationName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s_-]/g, '');
  }

  /**
   * idle 상태에서 랜덤 애니메이션 선택
   */
  private selectIdleAnimation(): string {
    const rand = Math.random();
    if (rand < 0.7) return 'idle';
    if (rand < 0.85) return 'idle2';
    if (rand < 0.95) return 'idle2headlow';
    return Math.random() < 0.5 ? 'idlehitreactleft' : 'idlehitreactright';
  }

  /**
   * 애니메이션 재생 (부드러운 전환)
   */
  private playAnimation(name: string): void {
    if (!this.mixer || this.animations.size === 0) return;

    const normalizedName = this.normalizeAnimationName(name);
    let action = this.animations.get(normalizedName);

    // 정확한 이름이 없으면 유사한 이름 찾기
    if (!action) {
      for (const [key, value] of this.animations.entries()) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          action = value;
          console.log(`Animation fallback: ${name} -> ${key}`);
          break;
        }
      }
    }

    // 애니메이션이 없으면 첫 번째 애니메이션 사용
    if (!action && this.animations.size > 0) {
      action = Array.from(this.animations.values())[0];
      console.log(`Animation fallback: using first animation for ${name}`);
    }

    if (action && action !== this.currentAnimation) {
      // 이전 애니메이션 페이드 아웃
      if (this.currentAnimation) {
        this.currentAnimation.fadeOut(0.3);
      }

      // 새 애니메이션 페이드 인
      action.reset().fadeIn(0.3).play();
      action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
      this.currentAnimation = action;
    }
  }

  private transitionToNextState(): void {
    if (!this.isModelLoaded) return;

    const rand = Math.random();

    // 확률 기반 상태 전환 (총 100%)
    if (rand < 0.35) {
      // 35%: 일반 배회
      this.enterWanderState();
    } else if (rand < 0.5) {
      // 15%: 질주
      this.enterGallopState();
    } else if (rand < 0.7) {
      // 20%: 대기 (다양한 idle 애니메이션)
      this.enterIdleState();
    } else if (rand < 0.85) {
      // 15%: 앉기
      this.enterSitState();
    } else if (rand < 0.95) {
      // 10%: 휴식 (머리 숙이기)
      this.enterRestingState();
    } else {
      // 5%: 놀기/공격 동작
      this.enterPlayingState();
    }
  }

  private enterIdleState(): void {
    this.state = 'idle';
    this.stateDuration = 3000 + Math.random() * 4000;
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();
    // 랜덤하게 다양한 idle 애니메이션 선택
    this.playAnimation(this.selectIdleAnimation());
  }

  private enterWanderState(): void {
    this.state = 'wander';
    this.stateDuration = 5000 + Math.random() * 5000;
    this.stateTimer = 0;

    // 3D 공간에서의 랜덤 위치 (X, Z 평면)
    const margin = 2;
    this.targetPosition = {
      x: -this.screenWidth / 2 + margin + Math.random() * (this.screenWidth - margin * 2),
      z: -this.screenHeight / 2 + margin + Math.random() * (this.screenHeight - margin * 2),
    };

    this.playAnimation('walk');
    this.moveToTarget();
  }

  private enterSitState(): void {
    this.state = 'sit';
    this.stateDuration = 4000 + Math.random() * 4000;
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();
    this.playAnimation('sit');
  }

  private enterEatingState(): void {
    this.state = 'eating';
    this.stateDuration = 2000 + Math.random() * 1000; // 2-3초
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();
    this.playAnimation('eating');
  }

  private enterGallopState(): void {
    this.state = 'gallop';
    this.stateDuration = 3000 + Math.random() * 3000; // 3-6초
    this.stateTimer = 0;

    // 질주 시에는 더 먼 거리로 이동
    const margin = 2;
    this.targetPosition = {
      x: -this.screenWidth / 2 + margin + Math.random() * (this.screenWidth - margin * 2),
      z: -this.screenHeight / 2 + margin + Math.random() * (this.screenHeight - margin * 2),
    };

    // 80% 확률로 gallop, 20% 확률로 gallopjump
    const animation = Math.random() < 0.8 ? 'gallop' : 'gallopjump';
    this.playAnimation(animation);
    this.moveToTargetFast(); // 빠른 이동 메서드 사용
  }

  private enterPlayingState(): void {
    this.state = 'playing';
    this.stateDuration = 2000 + Math.random() * 2000; // 2-4초
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();
    this.playAnimation('attack');
  }

  private enterRestingState(): void {
    this.state = 'resting';
    this.stateDuration = 4000 + Math.random() * 2000; // 4-6초
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();
    this.playAnimation('idle2headlow');
  }

  private stopGsapTween(): void {
    if (this.gsapTween) {
      this.gsapTween.kill();
      this.gsapTween = null;
    }
  }

  private moveToTarget(): void {
    if (!this.targetPosition) return;

    const deltaX = this.targetPosition.x - this.group.position.x;
    const deltaZ = this.targetPosition.z - this.group.position.z;

    // 목표 방향 각도 계산 (라디안)
    // atan2는 (-PI, PI) 범위를 반환하며, Z축이 앞쪽이므로 각도 조정
    const targetAngle = Math.atan2(deltaX, deltaZ);

    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    const moveDuration = distance / 2; // 일반 배회: 느린 속도
    const rotateDuration = 0.5; // 회전 속도 (고정)

    this.stopGsapTween();

    // 타임라인 생성: 회전 후 이동
    const timeline = gsap.timeline();

    // 1. 먼저 목표 방향으로 회전
    timeline.to(this.group.rotation, {
      y: targetAngle,
      duration: rotateDuration,
      ease: 'power2.inOut',
    });

    // 2. 회전하면서 동시에 이동 (약간의 딜레이 후)
    timeline.to(
      this.group.position,
      {
        x: this.targetPosition.x,
        z: this.targetPosition.z,
        duration: moveDuration,
        ease: 'power1.inOut',
        onComplete: () => {
          this.targetPosition = null;
        },
      },
      '-=0.3' // 회전이 70% 진행된 후 이동 시작
    );

    this.gsapTween = timeline as unknown as gsap.core.Tween;
  }

  private moveToTargetFast(): void {
    if (!this.targetPosition) return;

    const deltaX = this.targetPosition.x - this.group.position.x;
    const deltaZ = this.targetPosition.z - this.group.position.z;

    const targetAngle = Math.atan2(deltaX, deltaZ);

    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    const moveDuration = distance / 1.2; // 질주: 빠른 속도 (2배 빠름)
    const rotateDuration = 0.3; // 회전도 더 빠르게

    this.stopGsapTween();

    const timeline = gsap.timeline();

    // 빠른 회전
    timeline.to(this.group.rotation, {
      y: targetAngle,
      duration: rotateDuration,
      ease: 'power2.out',
    });

    // 빠른 이동
    timeline.to(
      this.group.position,
      {
        x: this.targetPosition.x,
        z: this.targetPosition.z,
        duration: moveDuration,
        ease: 'power1.inOut',
        onComplete: () => {
          this.targetPosition = null;
        },
      },
      '-=0.2'
    );

    this.gsapTween = timeline as unknown as gsap.core.Tween;
  }

  public update(delta: number): void {
    // 애니메이션 믹서 업데이트
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.isDragging || !this.isModelLoaded) {
      return;
    }

    // Catching 상태 처리
    if (this.state === 'catching') {
      this.catchingTimer += delta * 1000; // 밀리초로 변환
      if (this.catchingTimer >= 2000) {
        // 2초 후 eating 상태로 전환
        this.catchingTimer = 0;
        this.enterEatingState();
      }
      return;
    }

    // Eating 상태 처리
    if (this.state === 'eating') {
      // eating 상태 타이머 업데이트는 아래의 일반 타이머 로직에서 처리
      // eating이 끝나면 자동으로 transitionToNextState() 호출됨
    }

    // Following 모드일 때는 자동 상태 전환 비활성화
    if (this.isFollowing) {
      return;
    }

    // 상태 타이머 업데이트
    this.stateTimer += delta * 16.67;

    // 상태 지속 시간 체크
    if (this.stateTimer >= this.stateDuration) {
      this.transitionToNextState();
      return;
    }

    // WANDER 상태에서 목표 지점 도착 시 새 목표 설정
    if (this.state === 'wander' && !this.targetPosition) {
      const margin = 2;
      this.targetPosition = {
        x: -this.screenWidth / 2 + margin + Math.random() * (this.screenWidth - margin * 2),
        z: -this.screenHeight / 2 + margin + Math.random() * (this.screenHeight - margin * 2),
      };
      this.moveToTarget();
    }

    // GALLOP 상태에서 목표 지점 도착 시 새 목표 설정
    if (this.state === 'gallop' && !this.targetPosition) {
      const margin = 2;
      this.targetPosition = {
        x: -this.screenWidth / 2 + margin + Math.random() * (this.screenWidth - margin * 2),
        z: -this.screenHeight / 2 + margin + Math.random() * (this.screenHeight - margin * 2),
      };
      const animation = Math.random() < 0.8 ? 'gallop' : 'gallopjump';
      this.playAnimation(animation);
      this.moveToTargetFast();
    }
  }

  public getPosition(): { x: number; y: number; z: number } {
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
    };
  }

  public getVelocity(): { x: number; z: number } {
    return { ...this.velocity };
  }

  public getState():
    | 'idle'
    | 'wander'
    | 'sit'
    | 'dragging'
    | 'following'
    | 'catching'
    | 'eating'
    | 'gallop'
    | 'playing'
    | 'resting' {
    return this.state;
  }

  public setDragging(isDragging: boolean): void {
    this.isDragging = isDragging;
    if (isDragging) {
      this.state = 'dragging';
      this.stopGsapTween();
      this.velocity = { x: 0, z: 0 };
      this.playAnimation('idle');
      // 드래그 중에는 following 비활성화
      this.isFollowing = false;
    } else {
      this.transitionToNextState();
    }
  }

  public setFollowing(isFollowing: boolean): void {
    this.isFollowing = isFollowing;
    if (!isFollowing) {
      // Following 모드 종료 시 다시 자유 배회
      this.transitionToNextState();
    }
  }

  public followTarget(x: number, z: number): void {
    if (!this.isModelLoaded || this.isDragging) {
      return;
    }

    this.isFollowing = true;

    // 강아지 머리 위치 계산 (앞쪽으로 약 0.8 단위)
    const headDistance = 0.8;
    const headX = this.group.position.x + Math.sin(this.group.rotation.y) * headDistance;
    const headZ = this.group.position.z + Math.cos(this.group.rotation.y) * headDistance;

    // 테니스 공과 머리 사이의 거리 계산
    const headDeltaX = x - headX;
    const headDeltaZ = z - headZ;
    const distanceToHead = Math.sqrt(headDeltaX * headDeltaX + headDeltaZ * headDeltaZ);

    // 머리 근처에 있으면 "잡는" 동작
    if (distanceToHead < 0.8) {
      // 이미 catching 상태가 아닐 때만 전환
      if (this.state !== 'catching') {
        console.log('🐕 Catching tennis ball! Distance to head:', distanceToHead);
        this.state = 'catching';
        this.catchingTimer = 0;
        this.stopGsapTween();
        this.playAnimation('sit'); // sit 애니메이션으로 "잡는" 동작 표현
      }
      return;
    }

    // 이제 following 상태로 설정
    this.state = 'following';

    // 전체 거리 계산 (이동 속도 계산용)
    const deltaX = x - this.group.position.x;
    const deltaZ = z - this.group.position.z;
    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

    // 목표 방향으로 회전 및 이동
    this.targetPosition = { x, z };

    const targetAngle = Math.atan2(deltaX, deltaZ);
    const moveDuration = distance / 3; // 테니스 공 추적 속도 (빠르게)
    const rotateDuration = 0.3;

    this.stopGsapTween();
    this.playAnimation('walk');

    const timeline = gsap.timeline();

    // 회전
    timeline.to(this.group.rotation, {
      y: targetAngle,
      duration: rotateDuration,
      ease: 'power2.out',
    });

    // 이동
    timeline.to(
      this.group.position,
      {
        x,
        z,
        duration: moveDuration,
        ease: 'linear',
        onComplete: () => {
          this.targetPosition = null;
        },
      },
      '-=0.2'
    );

    this.gsapTween = timeline as unknown as gsap.core.Tween;
  }

  public setPosition(x: number, z: number): void {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  public destroy(): void {
    this.stopGsapTween();

    // 애니메이션 정리
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.animations.clear();
    this.currentAnimation = null;

    // 메시 제거
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

    // 모델 제거
    if (this.model) {
      this.group.remove(this.model);
      this.model = null;
    }
  }

  /**
   * 사용 가능한 애니메이션 목록 반환 (디버깅용)
   */
  public getAvailableAnimations(): string[] {
    return Array.from(this.animations.keys());
  }
}
