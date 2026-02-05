import * as PIXI from 'pixi.js';

export class Cat {
  public sprite: PIXI.Graphics;
  private velocity: { x: number; y: number };
  private isDragging: boolean;
  private dragOffset: { x: number; y: number };
  private lastDirectionChange: number;
  private directionChangeInterval: number;
  private screenWidth: number;
  private screenHeight: number;
  private radius: number = 40;

  constructor(x: number, y: number, screenWidth: number, screenHeight: number) {
    this.sprite = new PIXI.Graphics();
    this.velocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.lastDirectionChange = Date.now();
    this.directionChangeInterval = this.getRandomInterval();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 갈색 원 그리기
    this.drawCat();

    // 초기 위치 설정
    this.sprite.x = x;
    this.sprite.y = y;

    // 인터랙티브 설정
    this.sprite.eventMode = 'static';
    this.sprite.cursor = 'pointer';
    this.sprite.hitArea = new PIXI.Circle(0, 0, this.radius);

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 초기 방향 설정
    this.changeDirection();
  }

  private drawCat(): void {
    this.sprite.clear();

    // 갈색 원 (고양이 몸체)
    this.sprite.circle(0, 0, this.radius);
    this.sprite.fill(0xa0522d); // Sienna Brown

    // 작은 점 (방향 표시)
    this.sprite.circle(0, -this.radius * 0.3, 5);
    this.sprite.fill(0x000000);
  }

  private setupEventListeners(): void {
    this.sprite.on('pointerdown', this.onPointerDown.bind(this));
    this.sprite.on('pointerup', this.onPointerUp.bind(this));
    this.sprite.on('pointerupoutside', this.onPointerUp.bind(this));
    this.sprite.on('pointermove', this.onPointerMove.bind(this));
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    const position = event.global;
    this.dragOffset.x = position.x - this.sprite.x;
    this.dragOffset.y = position.y - this.sprite.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  private onPointerUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.changeDirection();
    }
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      const position = event.global;
      this.sprite.x = position.x - this.dragOffset.x;
      this.sprite.y = position.y - this.dragOffset.y;
    }
  }

  private getRandomInterval(): number {
    return 2000 + Math.random() * 3000; // 2-5초
  }

  private changeDirection(): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 50; // 50-100 px/s
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
    this.lastDirectionChange = Date.now();
    this.directionChangeInterval = this.getRandomInterval();
  }

  public update(delta: number): void {
    if (this.isDragging) {
      return;
    }

    // 주기적으로 방향 변경
    const currentTime = Date.now();
    if (currentTime - this.lastDirectionChange > this.directionChangeInterval) {
      this.changeDirection();
    }

    // 위치 업데이트
    const deltaSeconds = delta / 60; // PixiJS delta는 60fps 기준
    this.sprite.x += this.velocity.x * deltaSeconds;
    this.sprite.y += this.velocity.y * deltaSeconds;

    // 화면 경계 처리
    if (this.sprite.x - this.radius < 0) {
      this.sprite.x = this.radius;
      this.velocity.x *= -1;
    } else if (this.sprite.x + this.radius > this.screenWidth) {
      this.sprite.x = this.screenWidth - this.radius;
      this.velocity.x *= -1;
    }

    if (this.sprite.y - this.radius < 0) {
      this.sprite.y = this.radius;
      this.velocity.y *= -1;
    } else if (this.sprite.y + this.radius > this.screenHeight) {
      this.sprite.y = this.screenHeight - this.radius;
      this.velocity.y *= -1;
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public getVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }

  public getState(): 'idle' | 'walking' | 'dragging' {
    if (this.isDragging) return 'dragging';
    if (Math.abs(this.velocity.x) > 0 || Math.abs(this.velocity.y) > 0) return 'walking';
    return 'idle';
  }

  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  public destroy(): void {
    this.sprite.removeAllListeners();
    this.sprite.destroy();
  }
}
