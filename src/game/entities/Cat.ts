import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';

export class Cat {
  public sprite: PIXI.Graphics;
  private velocity: { x: number; y: number };
  private isDragging: boolean;
  private dragOffset: { x: number; y: number };
  private screenWidth: number;
  private screenHeight: number;
  private radius: number = 40;
  private state: 'idle' | 'wander' | 'sit' | 'dragging';
  private stateTimer: number;
  private stateDuration: number;
  private targetPosition: { x: number; y: number } | null;
  private gsapTween: gsap.core.Tween | null;
  private facingRight: boolean;

  constructor(x: number, y: number, screenWidth: number, screenHeight: number) {
    this.sprite = new PIXI.Graphics();
    this.velocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // FSM 초기화
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.targetPosition = null;
    this.gsapTween = null;
    this.facingRight = true;

    // 초기 위치 설정
    this.sprite.x = x;
    this.sprite.y = y;

    // 인터랙티브 설정
    this.sprite.eventMode = 'static';
    this.sprite.cursor = 'pointer';
    this.sprite.hitArea = new PIXI.Circle(0, 0, this.radius);

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 초기 상태 시작
    this.transitionToNextState();
  }

  private drawCat(): void {
    this.sprite.clear();

    if (this.state === 'sit') {
      // 타원형 (납작한 앉은 모양)
      this.sprite.ellipse(0, 10, this.radius, this.radius * 0.6);
      this.sprite.fill(0xa0522d);
      // 눈 표시
      this.sprite.circle(-10, 5, 3);
      this.sprite.circle(10, 5, 3);
      this.sprite.fill(0x000000);
    } else {
      // 원형 (기본 모양)
      this.sprite.circle(0, 0, this.radius);
      this.sprite.fill(0xa0522d);
      // 방향 표시점
      this.sprite.circle(0, -this.radius * 0.3, 5);
      this.sprite.fill(0x000000);
    }
  }

  private setupEventListeners(): void {
    this.sprite.on('pointerdown', this.onPointerDown.bind(this));
    this.sprite.on('pointerup', this.onPointerUp.bind(this));
    this.sprite.on('pointerupoutside', this.onPointerUp.bind(this));
    this.sprite.on('pointermove', this.onPointerMove.bind(this));
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.state = 'dragging';
    this.stopGsapTween();
    const position = event.global;
    this.dragOffset.x = position.x - this.sprite.x;
    this.dragOffset.y = position.y - this.sprite.y;
    this.velocity = { x: 0, y: 0 };
  }

  private onPointerUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.transitionToNextState();
    }
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      const position = event.global;
      this.sprite.x = position.x - this.dragOffset.x;
      this.sprite.y = position.y - this.dragOffset.y;
    }
  }

  private transitionToNextState(): void {
    const rand = Math.random();

    if (rand < 0.6) {
      this.enterWanderState();
    } else if (rand < 0.8) {
      this.enterIdleState();
    } else {
      this.enterSitState();
    }
  }

  private enterIdleState(): void {
    this.state = 'idle';
    this.stateDuration = 3000 + Math.random() * 4000;
    this.stateTimer = 0;
    this.velocity = { x: 0, y: 0 };
    this.stopGsapTween();
    this.drawCat();
  }

  private enterWanderState(): void {
    this.state = 'wander';
    this.stateDuration = 5000 + Math.random() * 5000;
    this.stateTimer = 0;

    this.targetPosition = {
      x: this.radius + Math.random() * (this.screenWidth - this.radius * 2),
      y: this.radius + Math.random() * (this.screenHeight - this.radius * 2),
    };

    this.moveToTarget();
    this.drawCat();
  }

  private enterSitState(): void {
    this.state = 'sit';
    this.stateDuration = 4000 + Math.random() * 4000;
    this.stateTimer = 0;
    this.velocity = { x: 0, y: 0 };
    this.stopGsapTween();
    this.drawCat();
  }

  private stopGsapTween(): void {
    if (this.gsapTween) {
      this.gsapTween.kill();
      this.gsapTween = null;
    }
  }

  private moveToTarget(): void {
    if (!this.targetPosition) return;

    const deltaX = this.targetPosition.x - this.sprite.x;
    if (deltaX > 0 && !this.facingRight) {
      this.sprite.scale.x = 1;
      this.facingRight = true;
    } else if (deltaX < 0 && this.facingRight) {
      this.sprite.scale.x = -1;
      this.facingRight = false;
    }

    const distance = Math.hypot(deltaX, this.targetPosition.y - this.sprite.y);
    const duration = distance / 100;

    this.stopGsapTween();

    this.gsapTween = gsap.to(this.sprite, {
      x: this.targetPosition.x,
      y: this.targetPosition.y,
      duration: duration,
      ease: 'power1.inOut',
      onComplete: () => {
        this.targetPosition = null;
      },
    });
  }

  public update(delta: number): void {
    if (this.isDragging) {
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
      this.targetPosition = {
        x: this.radius + Math.random() * (this.screenWidth - this.radius * 2),
        y: this.radius + Math.random() * (this.screenHeight - this.radius * 2),
      };
      this.moveToTarget();
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public getVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }

  public getState(): 'idle' | 'wander' | 'sit' | 'dragging' {
    return this.state;
  }

  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  public destroy(): void {
    this.stopGsapTween();
    this.sprite.removeAllListeners();
    this.sprite.destroy();
  }
}
