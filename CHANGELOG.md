# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/yourusername/save-the-cat/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/yourusername/save-the-cat/releases/tag/v0.0.0
