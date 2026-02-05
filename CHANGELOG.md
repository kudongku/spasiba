# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-05

### Added
- 📱 Full responsive design implementation
  - Dynamic camera positioning based on screen size (mobile/tablet/desktop)
  - Responsive UI button sizing with Tailwind breakpoints
  - Touch device optimization (touch-action, tap-highlight removal)
  - Mobile browser address bar handling with `100dvh`
  - Device pixel ratio optimization for better performance
- 🚀 GitHub Pages deployment configuration
  - Added `gh-pages` package for automated deployment
  - Configured Vite base path for GitHub Pages
  - Added deploy scripts to package.json
- 📐 Custom Tailwind breakpoint (xs: 475px)

### Changed
- 🐕 Increased Shiba Inu model size by 1.2x
- 📷 Camera FOV and position now adjust based on viewport width
  - Mobile: fov 60, position [0, 10, 15]
  - Tablet: fov 55, position [0, 9, 13]
  - Desktop: fov 50, position [0, 8, 12]
- 🎮 Improved OrbitControls zoom range for different screen sizes
- 🎨 Enhanced CSS for better mobile UX
  - Prevented unwanted touch gestures
  - Disabled text selection during interaction
  - Added touch-manipulation for better button interaction

### Technical Details
- Responsive breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px)
- Touch device cursor handling with media queries
- Automatic window resize detection and camera reconfiguration
- Performance optimization with adaptive device pixel ratio

## [0.2.0] - 2026-02-05

### Changed
- 🐕 Replace Cat3DModel with Shiba3DModel (고양이 → 시바견)
- 🎾 Replace YarnBall with TennisBall (실뭉치 → 테니스공)
- 🌿 Add gradient ground with grass colors (초원색 그라데이션 바닥 추가)
- 📝 Update project name and descriptions to reflect new theme
- 🎨 Implement custom shader for radial and vertical gradient ground

### Added
- `Shiba3DComponent.tsx` - Interactive 3D Shiba Inu component
- `TennisBallComponent.tsx` - 3D tennis ball component
- `Shiba3DModel.ts` - Shiba Inu entity with FSM behaviors
- `TennisBall.ts` - Tennis ball entity
- `GradientGround` component with custom GLSL shaders

### Removed
- `Cat3DComponent.tsx` - Replaced by Shiba component
- `YarnBallComponent.tsx` - Replaced by tennis ball component
- `Cat3DModel.ts` - Replaced by Shiba model
- `YarnBall.ts` - Replaced by tennis ball

### Technical Details
- Ground shader uses radial and vertical gradients
- Colors: Light grass (#8bc34a) to dark grass (#558b2f)
- Shiba model positioned at y=0 to align with ground plane

## [0.1.0] - 2026-02-05

### Added
- Three.js 3D 렌더링 엔진 통합
- React Three Fiber를 활용한 React 통합
- React Three Drei 헬퍼 유틸리티
- GSAP 애니메이션 시스템 구현
- GLB 형식 3D 모델 로더 (`Cat3DModel.ts`)
- FSM(Finite State Machine) 기반 상태 관리
- 3D 고양이 인터랙티브 컴포넌트 (`Cat3DComponent.tsx`)
- Three.js 메인 캔버스 컴포넌트 (`ThreeCanvas.tsx`)
- Biome 린터 & 포매터 설정
- Lefthook Git Hooks 자동화 (pre-commit, pre-push)
- Tailwind CSS 스타일링 시스템
- TypeScript 5 strict 모드 활성화

### Changed
- PixiJS에서 Three.js로 렌더링 엔진 마이그레이션
- 2D에서 3D 게임 환경으로 전환

### Technical Details
- **React**: 18.3.1
- **TypeScript**: 5.9.3
- **Three.js**: 0.169.0
- **GSAP**: 3.14.2
- **Build Tool**: Vite 5.4.21

## [0.0.0] - 2026-02-05

### Added
- 초기 프로젝트 설정
- Vite + React + TypeScript 보일러플레이트
- 기본 프로젝트 구조 생성

[0.3.0]: https://github.com/yourusername/save-the-cat/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yourusername/save-the-cat/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/save-the-cat/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/yourusername/save-the-cat/releases/tag/v0.0.0
