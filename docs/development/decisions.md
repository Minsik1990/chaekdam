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
- **결정**: Claude Sonnet 4.5 단일 모델로 AI 에이전트 운영
- **근거**:
  - 문학 분석, 발제문 생성 등 핵심 기능에 충분한 품질 필요
  - 한국어 성능 우수 (감성 대화, 따뜻한 톤 유지)
  - Prompt Caching으로 비용 90% 절감 가능
  - 스트리밍 응답 지원
  - 모델 라우팅 로직 제거 → 복잡도 최소화
- **비용 예상**:
  - Sonnet $3/$15 per 1M tokens
  - 10명 모임 기준: ~$3/월 (약 4,000원), Prompt Caching 적용 시 더 절감

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

## ADR-006: Spec-Driven Development 방법론

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: Spec-Driven + AI-First 개발 방법론 채택
- **근거**:
  - Addy Osmani의 2026 LLM 코딩 워크플로우 기반 (가장 검증된 접근법)
  - "Explore → Plan → Implement → Verify → Commit" 5단계
  - PRD를 AI가 소비 가능한 형식으로 작성 (Prompt Requirements Document)
  - Human-in-the-Loop (고위험) vs Human-on-the-Loop (저위험) 구분
  - 솔로 개발자 + Claude Code 조합에 최적화
- **출처**:
  - [Addy Osmani, My LLM Coding Workflow Going into 2026](https://addyosmani.com/blog/ai-coding-workflow/)
  - [UXPin, Structure AI-Assisted Development with PRDs](https://www.uxpin.com/studio/blog/structure-ai-assisted-development-prds/)
  - [Claude Code Best Practices (공식)](https://code.claude.com/docs/en/best-practices)

---

## ADR-007: CLAUDE.md 간결화 원칙

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: CLAUDE.md를 50-100줄로 유지, 상세는 docs/ 포인터
- **근거**:
  - 모든 단어가 컨텍스트 토큰 소비 → 간결할수록 AI 성능 향상
  - WHY > WHAT 원칙 (무엇을 하는지보다 왜 하는지)
  - 코드 복사 대신 파일 경로 포인터 사용
  - CRITICAL 키워드로 핵심 제약 강조
- **출처**:
  - [Builder.io, The Complete Guide to CLAUDE.md](https://www.builder.io/blog/claude-md-guide)
  - [HumanLayer, Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## ADR-008: Public GitHub 레포

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: GitHub 레포를 Public으로 운영 (기존 ADR-006에서 번호 변경)
- **근거**:
  - GitHub Actions 무제한 사용 (Private은 2,000분/월)
  - 오픈소스 커뮤니티 기여 가능성
  - 비밀 키는 Vercel 환경 변수로 관리 (코드에 포함하지 않음)
- **주의사항**:
  - `.env` 파일 절대 커밋 금지
  - API 키, 시크릿 등은 반드시 환경 변수 사용
  - `.gitignore`에 민감 파일 반드시 포함

---

## ADR-009: MVP 초대 코드 인증 (로그인 없음)

- **날짜**: 2026-02-07
- **상태**: 확정
- **결정**: Phase 1 MVP에서 로그인/회원가입 없이 초대 코드 + 닉네임으로 접근 제어
- **흐름**: 사이트 접속 → 초대 코드 입력 → 닉네임 설정 → 쿠키 저장 → 앱 사용
- **근거**:
  - MVP는 10~30명 소규모 독서 모임 대상 → 무거운 인증 불필요
  - 카카오 OAuth 설정/테스트 시간 절약
  - Supabase Auth 의존성 제거 → 프로젝트 셋업 단순화
  - 카톡방에 코드 공유하면 바로 사용 가능 (진입 장벽 최소화)
- **구현**:
  - 환경 변수 `INVITE_CODE`에 비밀 코드 저장
  - Next.js 미들웨어에서 쿠키 체크
  - 후기/발제문 작성자는 닉네임으로 표시
- **마이그레이션 경로**: Phase 3에서 Supabase Auth + 카카오 OAuth 전환 시 닉네임 → 계정으로 매핑
- **주의사항**:
  - 초대 코드는 환경 변수이므로 런타임에 변경하려면 Vercel 재배포 필요
  - 쿠키 만료 설정 필요 (예: 30일)
