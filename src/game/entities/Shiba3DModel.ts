import { gsap } from 'gsap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ShibaAnimationType, ShibaState } from '@/types/game';

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
  private state: ShibaState;
  private stateTimer: number;
  private stateDuration: number;
  private targetPosition: { x: number; z: number } | null;
  private gsapTween: gsap.core.Tween | null;
  private isModelLoaded: boolean;
  private isFollowing: boolean;

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
    this.state = 'resting';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.targetPosition = null;
    this.gsapTween = null;
    this.isModelLoaded = false;
    this.isFollowing = false;

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
      const center = box.getCenter(new THREE.Vector3());

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
   * resting 상태에서 랜덤 애니메이션 선택 (확률 기반)
   */
  private selectRestingAnimation(): ShibaAnimationType {
    const rand = Math.random();
    if (rand < 0.35) return 'idle'; // 35%
    if (rand < 0.6) return 'idle2'; // 25%
    if (rand < 0.8) return 'idle2headlow'; // 20%
    if (rand < 0.9) return 'eating'; // 10%
    return 'death'; // 10%
  }

  /**
   * moving 상태에서 확률 기반 애니메이션 선택
   */
  private selectMovingAnimation(): ShibaAnimationType {
    const rand = Math.random();
    if (rand < 0.4) return 'walk'; // 40%
    if (rand < 0.8) return 'gallop'; // 40%
    return 'gallopjump'; // 20%
  }

  /**
   * 방향 전환 감지
   */
  private previousAngle: number | null = null;

  private detectDirectionChange(newAngle: number): 'left' | 'right' | null {
    if (this.previousAngle === null) {
      this.previousAngle = newAngle;
      return null;
    }

    const angleDiff = newAngle - this.previousAngle;
    const threshold = Math.PI / 4; // 45도

    if (Math.abs(angleDiff) < threshold) {
      return null;
    }

    this.previousAngle = newAngle;

    // 각도 차이가 양수면 반시계방향(왼쪽), 음수면 시계방향(오른쪽)
    return angleDiff > 0 ? 'left' : 'right';
  }

  /**
   * 애니메이션 재생 (부드러운 전환)
   */
  private playAnimation(name: ShibaAnimationType | string): void {
    if (!this.mixer || this.animations.size === 0) return;

    const normalizedName = this.normalizeAnimationName(name);
    let action = this.animations.get(normalizedName);

    // 정확한 이름이 없으면 유사한 이름 찾기
    if (!action) {
      for (const [key, value] of this.animations.entries()) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          action = value;
          break;
        }
      }
    }

    // 애니메이션이 없으면 첫 번째 애니메이션 사용
    if (!action && this.animations.size > 0) {
      action = Array.from(this.animations.values())[0];
    }

    if (action) {
      // 이전 애니메이션 정리 (death 애니메이션이 아닐 때만)
      if (this.currentAnimation && action !== this.currentAnimation) {
        this.currentAnimation.fadeOut(0.3);
      }

      // death 애니메이션은 특별 처리: 정방향 -> 3초 대기 -> 역방향
      if (normalizedName === 'death') {
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.timeScale = 1;
        action.setEffectiveWeight(1);
        action.play();

        // 애니메이션 길이 가져오기
        const animationDuration = action.getClip().duration * 1000;

        // 정방향 재생 완료 후 3초 대기
        setTimeout(() => {
          if (this.state !== 'resting') return;

          // 3초 대기 후 역방향 재생
          setTimeout(() => {
            if (this.state !== 'resting') return;

            // 역방향 재생: 새로 시작
            action.reset();
            action.time = action.getClip().duration; // 끝에서 시작
            action.timeScale = -1; // 역방향
            action.clampWhenFinished = false;
            action.setLoop(THREE.LoopOnce, 1);
            action.play();
          }, 3000);
        }, animationDuration);
      } else if (action !== this.currentAnimation) {
        // 일반 애니메이션
        action.reset().fadeIn(0.3).play();
        action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
      }

      this.currentAnimation = action;
    }
  }

  /**
   * 다음 상태로 전환 (resting 또는 moving)
   */
  private transitionToNextState(): void {
    if (!this.isModelLoaded) return;

    const rand = Math.random();

    // 60% resting, 40% moving
    if (rand < 0.6) {
      this.enterResting();
    } else {
      this.enterMoving();
    }
  }

  /**
   * Resting 상태 진입
   */
  private enterResting(): void {
    this.state = 'resting';
    this.stateTimer = 0;
    this.velocity = { x: 0, z: 0 };
    this.stopGsapTween();

    const selectedAnimation = this.selectRestingAnimation();

    // death 애니메이션은 더 긴 시간 필요 (정방향 + 3초 대기 + 역방향)
    if (selectedAnimation === 'death') {
      const normalizedName = this.normalizeAnimationName('death');
      const action = this.animations.get(normalizedName);
      const animationDuration = action ? action.getClip().duration * 1000 : 1000;
      this.stateDuration = animationDuration * 2 + 3000; // 약 5-6초
    } else {
      this.stateDuration = 3000 + Math.random() * 4000; // 3-7초
    }

    this.playAnimation(selectedAnimation);
  }

  /**
   * Moving 상태 진입
   */
  private enterMoving(): void {
    this.state = 'moving';

    // 랜덤 목표 위치 설정
    const margin = 2;
    this.targetPosition = {
      x: -this.screenWidth / 2 + margin + Math.random() * (this.screenWidth - margin * 2),
      z: -this.screenHeight / 2 + margin + Math.random() * (this.screenHeight - margin * 2),
    };

    const deltaX = this.targetPosition.x - this.group.position.x;
    const deltaZ = this.targetPosition.z - this.group.position.z;
    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

    this.stateDuration = distance * 1000; // 거리에 비례
    this.stateTimer = 0;

    // 방향 전환 체크
    const targetAngle = Math.atan2(deltaX, deltaZ);
    const direction = this.detectDirectionChange(targetAngle);

    if (direction === 'left') {
      this.enterMovingLeft(distance);
    } else if (direction === 'right') {
      this.enterMovingRight(distance);
    } else {
      // 확률 기반 애니메이션 선택
      this.playAnimation(this.selectMovingAnimation());
      this.moveToTarget(distance);
    }
  }

  /**
   * MovingLeft 상태 진입 (왼쪽 방향 전환)
   */
  private enterMovingLeft(distance: number): void {
    this.state = 'movingLeft';
    this.playAnimation('idlehitreactleft');

    // 0.5초 후 moving으로 전환
    setTimeout(() => {
      if (this.state === 'movingLeft') {
        this.state = 'moving';
        this.playAnimation(this.selectMovingAnimation());
        this.moveToTarget(distance);
      }
    }, 500);
  }

  /**
   * MovingRight 상태 진입 (오른쪽 방향 전환)
   */
  private enterMovingRight(distance: number): void {
    this.state = 'movingRight';
    this.playAnimation('idlehitreactright');

    // 0.5초 후 moving으로 전환
    setTimeout(() => {
      if (this.state === 'movingRight') {
        this.state = 'moving';
        this.playAnimation(this.selectMovingAnimation());
        this.moveToTarget(distance);
      }
    }, 500);
  }

  /**
   * Catching 상태 진입 (테니스 공 잡기)
   */
  private enterCatching(): void {
    this.state = 'catching';
    this.stopGsapTween();

    // 1단계: jumptoidle (1초)
    this.playAnimation('jumptoidle');

    setTimeout(() => {
      if (this.state === 'catching') {
        // 2단계: attack (1초)
        this.playAnimation('attack');

        setTimeout(() => {
          // 완료 후 resting으로
          this.enterResting();
        }, 1000);
      }
    }, 1000);
  }

  private stopGsapTween(): void {
    if (this.gsapTween) {
      this.gsapTween.kill();
      this.gsapTween = null;
    }
  }

  /**
   * 목표 지점으로 이동 (거리 기반 속도)
   */
  private moveToTarget(distance: number): void {
    if (!this.targetPosition) return;

    const deltaX = this.targetPosition.x - this.group.position.x;
    const deltaZ = this.targetPosition.z - this.group.position.z;

    // 목표 방향 각도 계산
    const targetAngle = Math.atan2(deltaX, deltaZ);

    // 거리에 따른 속도 결정
    let speed: number;
    if (distance < 3) {
      speed = 2; // walk: 느린 속도
    } else if (distance < 8) {
      speed = 3; // gallop: 중간 속도
    } else {
      speed = 4; // gallopjump: 빠른 속도
    }

    const moveDuration = distance / speed;
    const rotateDuration = 0.4; // 회전 속도

    this.stopGsapTween();

    // 타임라인 생성: 회전 후 이동
    const timeline = gsap.timeline();

    // 1. 먼저 목표 방향으로 회전
    timeline.to(this.group.rotation, {
      y: targetAngle,
      duration: rotateDuration,
      ease: 'power2.inOut',
    });

    // 2. 회전하면서 동시에 이동
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

  public update(delta: number): void {
    // 애니메이션 믹서 업데이트
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.isDragging || !this.isModelLoaded) {
      return;
    }

    // Catching, MovingLeft, MovingRight 상태는 타이머로 관리되므로 스킵
    if (this.state === 'catching' || this.state === 'movingLeft' || this.state === 'movingRight') {
      return;
    }

    // Following 모드일 때는 자동 상태 전환 비활성화
    if (this.isFollowing) {
      return;
    }

    // 상태 타이머 업데이트
    this.stateTimer += delta * 1000; // 밀리초로 변환

    // 상태 지속 시간 체크
    if (this.stateTimer >= this.stateDuration) {
      this.transitionToNextState();
      return;
    }

    // Moving 상태에서 목표 지점 도착 체크
    if (this.state === 'moving' && !this.targetPosition) {
      this.transitionToNextState();
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

  public getState(): ShibaState {
    return this.state;
  }

  public setDragging(isDragging: boolean): void {
    this.isDragging = isDragging;
    if (isDragging) {
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

    // 머리 근처에 있으면 catching 상태로
    if (distanceToHead < 0.8) {
      if (this.state !== 'catching') {
        this.enterCatching();
      }
      return;
    }

    // 전체 거리 계산
    const deltaX = x - this.group.position.x;
    const deltaZ = z - this.group.position.z;
    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

    // 확률 기반 애니메이션 선택
    this.playAnimation(this.selectMovingAnimation());

    // 목표 방향으로 회전 및 이동
    this.targetPosition = { x, z };

    const targetAngle = Math.atan2(deltaX, deltaZ);
    const moveDuration = distance / 3; // 테니스 공 추적 속도 (빠르게)
    const rotateDuration = 0.3;

    this.stopGsapTween();

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
