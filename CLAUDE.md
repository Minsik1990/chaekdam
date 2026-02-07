# CLAUDE.md

## 프로젝트

**Mingdle (밍들)** — 독서 모임 웹앱. AI 독서 에이전트 "밍들레"가 핵심 기능.

- Stack: Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui (Maia)
- Backend: Supabase (PostgreSQL + RLS) | 배포: Vercel | AI: Claude Sonnet 4.5
- 인증: 초대 코드 + 닉네임 (쿠키 기반, 로그인 없음) — OAuth는 Phase 3
- 도서 API: 네이버 도서 (1개만) | 이미지: Supabase Storage

## 명령어

```bash
pnpm dev                    # 개발 서버
pnpm build                  # 프로덕션 빌드
pnpm lint && pnpm typecheck # 커밋 전 필수 검증
pnpm test                   # Vitest
pnpm test:e2e               # Playwright E2E
npx supabase gen types typescript --local > database.types.ts  # DB 변경 후 필수
```

## 아키텍처 핵심

- Server Components 기본, 'use client'는 필요 시만
- Supabase 클라이언트: `@/lib/supabase/client` (브라우저) / `server` (서버)
- 도서 검색: API → books 테이블 캐싱 (Rate Limit 방지)
- AI 에이전트: API Route → 컨텍스트 구성 → Claude API 스트리밍 → 대화 이력 저장
- 상세: `docs/design/architecture.md`, `docs/design/database-schema.md`

## CRITICAL 제약

- **RLS 필수**: 새 테이블에 반드시 RLS 활성화 + 정책 작성
- **타입 재생성**: DB 변경 후 `supabase gen types` 실행
- **무료 한도**: Supabase 500MB DB, Vercel 100GB 대역폭, 7일 비활성 일시정지 방지
- **AI 비용**: Claude Sonnet 4.5 단일 모델, Prompt Caching 필수
- 상세: `docs/research/cost-analysis.md`

## 코딩 컨벤션

- 한국어 주석/커밋 (기술 용어는 영어)
- Tailwind 클래스 사용, inline styles 지양
- shadcn/ui 컴포넌트 우선
- 색상: 그린(#7CB342) + 노랑(#FFD54F) + 핑크(#FFB5B5) — 밍들레씨 캐릭터 기반

## 개발 프로세스 (Spec-Driven)

```
Explore → Plan → Implement → Verify → Commit
```

1. **Explore**: Plan Mode에서 코드 읽기, 기존 패턴 파악
2. **Plan**: PRD 작성/확인 → 구현 계획 → 복잡한 결정은 sequential-thinking
3. **Implement**: 한 번에 하나의 함수/기능, 기존 패턴 따르기
4. **Verify**: `pnpm typecheck && pnpm lint && pnpm build`
5. **Commit**: 설명적 메시지, /clear 후 다음 기능

- 상세: `docs/research/dev-methodology-2026.md`

## MCP 활용

| 작업        | 우선 도구                                           |
| ----------- | --------------------------------------------------- |
| DB 작업     | `mcp__supabase__execute_sql`, `list_tables`         |
| 문서 조회   | `mcp__context7__query-docs`                         |
| 복잡한 결정 | `mcp__sequential-thinking__sequentialthinking`      |
| 코드 분석   | `mcp__serena__find_symbol`, `get_symbols_overview`  |
| UI 검증     | `mcp__chrome-devtools__*` 또는 `mcp__playwright__*` |

## 문서

| 문서                                    | 내용                                         |
| --------------------------------------- | -------------------------------------------- |
| `docs/design/character.md`              | 밍들레씨 캐릭터 + "밍들레" 에이전트 페르소나 |
| `docs/design/ui-ux.md`                  | 색상, 컴포넌트, 뷰 구성                      |
| `docs/design/api-design.md`             | 외부 API, 캐싱 전략, 환경 변수               |
| `docs/development/roadmap.md`           | Phase별 체크리스트                           |
| `docs/research/dev-methodology-2026.md` | PRD 템플릿, CI/CD, 테스트 전략               |
