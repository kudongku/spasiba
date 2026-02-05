import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { Cat } from '@/game/entities/Cat';
import { useCatStore } from '@/store/catStore';

const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const catRef = useRef<Cat | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const { setPosition, setVelocity, setState } = useCatStore();

  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return;

    isInitializedRef.current = true;
    let isMounted = true;

    // PixiJS Application 생성
    const app = new PIXI.Application();
    appRef.current = app;

    // 초기화 함수
    const init = async () => {
      try {
        await app.init({
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0xf5f5f5,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!isMounted || !canvasRef.current) return;

        canvasRef.current.appendChild(app.canvas);

        // Cat 인스턴스 생성
        const cat = new Cat(
          window.innerWidth / 2,
          window.innerHeight / 2,
          window.innerWidth,
          window.innerHeight
        );
        catRef.current = cat;

        app.stage.addChild(cat.sprite);

        // 게임 루프
        const gameLoop = () => {
          if (!isMounted || !catRef.current) return;

          // Cat 업데이트
          catRef.current.update(app.ticker.deltaMS / 16.67); // 60fps 기준으로 정규화

          // Zustand 스토어 동기화
          const position = catRef.current.getPosition();
          const velocity = catRef.current.getVelocity();
          const state = catRef.current.getState();

          setPosition(position.x, position.y);
          setVelocity(velocity.x, velocity.y);
          setState(state);

          animationFrameRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoop();
      } catch (error) {
        console.error('Failed to initialize PixiJS:', error);
      }
    };

    init();

    // 창 크기 변경 핸들러
    const handleResize = () => {
      if (appRef.current && catRef.current) {
        appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
        catRef.current.updateScreenSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (catRef.current) {
        catRef.current.destroy();
        catRef.current = null;
      }

      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (error) {
          // Suppress destroy errors in StrictMode
          console.warn('PixiJS cleanup warning:', error);
        }
        appRef.current = null;
      }
    };
  }, [setPosition, setVelocity, setState]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

export default PixiCanvas;
