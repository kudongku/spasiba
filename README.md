# Save The Cat

고양이를 구하는 3D 인터랙티브 게임 프로젝트입니다.

## 기술 스택

### 핵심 기술
- **React 18** - UI 프레임워크
- **TypeScript 5** - 타입 안전성
- **Three.js 0.169** - 3D 렌더링 엔진
- **React Three Fiber 8** - Three.js의 React 래퍼
- **React Three Drei 9** - Three.js 헬퍼 유틸리티
- **GSAP 3** - 고급 애니메이션 라이브러리
- **Tailwind CSS 3** - 유틸리티 기반 스타일링
- **Vite 5** - 초고속 빌드 도구

### 개발 도구
- **Biome** - 고속 린터 & 포매터
- **Lefthook** - Git Hooks 관리
- **pnpm** - 효율적인 패키지 매니저

## 설치 및 실행

```bash
# 의존성 설치 (Git hooks 자동 설치됨)
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 미리보기
pnpm preview
```


## 코드 품질 관리

### 스크립트

```bash
# 린팅 (오류 자동 수정)
pnpm lint

# 포맷팅 (코드 스타일 자동 수정)
pnpm format

# 린팅 + 포맷팅 통합 (권장)
pnpm check
```

### Git Hooks

프로젝트는 Lefthook을 사용하여 자동으로 코드 품질을 관리합니다:

#### Pre-commit Hook
커밋 전에 자동으로 실행됩니다:
- Biome 체크 (병렬 실행)
- TypeScript 타입 체크 (병렬 실행)
- 자동 수정 가능한 오류는 자동으로 수정
- 수정 불가능한 오류 발견 시 커밋 차단

#### Pre-push Hook
푸시 전에 자동으로 실행됩니다:
- 프로덕션 빌드 테스트
- 빌드 실패 시 푸시 차단

## 프로젝트 구조

```
/
├── public/
│   └── models/               # 3D 모델 파일 (.glb)
│       └── Shiba Inu.glb     # 시바견 3D 모델 (애니메이션 포함)
└── src/
    ├── components/           # React 컴포넌트
    │   ├── ThreeCanvas.tsx       # Three.js 메인 캔버스
    │   └── Cat3DComponent.tsx    # 3D 고양이 인터랙티브 컴포넌트
    ├── game/                 # 게임 로직
    │   └── entities/
    │       └── Cat3DModel.ts     # GLTF 3D 모델 로더 & FSM 로직
    ├── App.tsx               # 메인 App 컴포넌트
    ├── main.tsx              # 진입점
    └── index.css             # 전역 스타일 (Tailwind)
```
