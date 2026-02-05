# Save The Cat 

## 디렉토리 구조

```
/src
├── /components      # React UI (메뉴, 버튼, 오버레이)
├── /game            # PixiJS 로직 (핵심 엔진)
│   ├── /entities    # 객체별 로직 (Hamster.ts, Item.ts 등)
│   └── /systems     # 시스템 로직 (Movement.ts, Interaction.ts 등)
├── /store           # Zustand 상태 관리 (위치, 아이템 상태 저장)
└── /assets          # 정적 리소스 (이미지, 사운드)
```

