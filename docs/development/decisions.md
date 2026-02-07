# 기술 결정 기록 (Architecture Decision Records)

> 주요 기술 결정과 그 근거를 기록합니다.

---

## ADR-001: Next.js 15 App Router 채택

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: Next.js 15 (App Router)를 프론트엔드/풀스택 프레임워크로 사용
- **근거**:
  - Vercel과 최적 통합 (자동 배포, Preview, 이미지 최적화)
  - React Server Components로 성능 최적화
  - App Router가 안정화되어 프로덕션 사용 가능
  - Supabase 공식 템플릿 제공
  - 풍부한 생태계 (shadcn/ui, Tailwind 등)
- **대안 검토**:
  - Remix: Vercel 통합 약함, 커뮤니티 규모 작음
  - Nuxt: Vue 생태계 (React 대비 UI 라이브러리 적음)
  - SvelteKit: 생태계 아직 성숙하지 않음

---

## ADR-002: Supabase 선택

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: Supabase를 Backend-as-a-Service로 사용
- **근거**:
  - PostgreSQL 기반 관계형 DB (독서 모임 데이터에 적합)
  - Auth, Storage, Realtime, Edge Functions 통합 제공
  - 무료 티어가 넉넉 (500MB DB, 50K MAU)
  - MCP 서버로 자연어 스키마 설계 가능
  - 타입 자동 생성 (`supabase gen types`)
- **대안 검토**:
  - Firebase: NoSQL 구조가 관계형 데이터에 부적합
  - PlanetScale: Auth, Storage 별도 구성 필요
  - Neon: DB만 제공 (Auth, Storage 없음)
- **주의사항**:
  - 7일 비활성 시 자동 일시정지 → cron job으로 방지
  - Storage 1GB 한계 → Cloudflare R2로 보완

---

## ADR-003: Claude API 선택

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: Claude API (Haiku 4.5 메인 + Sonnet 4.5 보조)를 AI 에이전트에 사용
- **근거**:
  - 한국어 성능 우수 (특히 문학 분석, 감성 대화)
  - Prompt Caching으로 비용 90% 절감 가능
  - Haiku 4.5가 매우 저렴 ($1/$5 per 1M tokens)
  - 스트리밍 응답 지원
  - "밍들이" 페르소나에 적합한 따뜻한 톤 유지 가능
- **대안 (백업)**:
  - Google Gemini Flash-Lite: 무료, 한국어 우수 (비용 0 필요 시)
  - OpenRouter 무료 모델: 다양한 모델 선택지
- **비용 예상**:
  - 10명 모임 기준: $2~5/월 (약 3,000~7,000원)

---

## ADR-004: shadcn/ui Maia 스타일 채택

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: shadcn/ui를 UI 컴포넌트 라이브러리로, Maia 스타일로 설정
- **근거**:
  - 복사-붙여넣기 방식 → 완전한 커스터마이징
  - Radix UI 기반 접근성 보장
  - Maia 스타일: 둥근 모서리 + 부드러운 느낌 (Mingdle 디자인 철학과 일치)
  - Tailwind CSS와 완벽 호환
  - 번들 사이즈 최적화 (사용하는 컴포넌트만 포함)
- **대안 검토**:
  - MUI: 무겁고, 커스터마이징 어려움, Material 디자인 느낌
  - Ant Design: 중국풍 디자인, 한국 서비스 느낌과 맞지 않음
  - Chakra UI: shadcn/ui 대비 번들 무거움

---

## ADR-005: Cloudflare R2 (이미지 저장)

- **날짜**: 2026-02-07
- **상태**: 확정 (Phase 2에서 구현)
- **결정**: 모임 사진 저장에 Cloudflare R2 사용
- **근거**:
  - 무료 10GB (Supabase Storage 1GB의 10배)
  - Egress(전송) 완전 무료
  - S3 호환 API (기존 도구/라이브러리 활용 가능)
- **대안 검토**:
  - Supabase Storage: 1GB 한계, Egress 2GB/월
  - AWS S3: 유료
  - Uploadthing: 무료 한도 제한적

---

## ADR-006: Public GitHub 레포

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: GitHub 레포를 Public으로 운영
- **근거**:
  - GitHub Actions 무제한 사용 (Private은 2,000분/월)
  - 오픈소스 커뮤니티 기여 가능성
  - 비밀 키는 Vercel 환경 변수로 관리 (코드에 포함하지 않음)
- **주의사항**:
  - `.env` 파일 절대 커밋 금지
  - API 키, 시크릿 등은 반드시 환경 변수 사용
  - `.gitignore`에 민감 파일 반드시 포함
