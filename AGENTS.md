# DokDok (독독) - Agent Instructions

> 모든 AI 코딩 에이전트 (Claude Code, Cursor, Windsurf 등) 호환 가이드

## Project Context

개인 독서 기록 웹앱. 개인 기록이 메인, 독서 모임은 부가 기능. AI는 도구형 에이전트.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS v4 + shadcn/ui (포레스트그린 #2D6A4F 테마)
- Supabase (PostgreSQL + RLS + Auth Magic Link)
- Claude API: Sonnet 4.5 (분석) + Haiku 4.5 (대화)
- 네이버 도서 검색 API
- Vercel (Hobby) 배포

## Core Patterns

1. **Server Components 기본**, 'use client'는 필요 시만
2. **Supabase 클라이언트**: `@/lib/supabase/client` (브라우저) / `server` (서버)
3. **AI 에이전트**: `src/lib/agent/` → API Routes → SSE 스트리밍
4. **인증**: Supabase Auth Magic Link → 미들웨어 세션 체크 → profiles
5. **도서 검색**: 네이버 API → books 테이블 캐싱 (Rate Limit 방지)
6. **RLS 필수**: 모든 테이블에 Row Level Security

## Development Workflow

1. **Explore**: 코드 읽기, 기존 패턴 파악
2. **Plan**: 기획서/구현 계획 → 사용자 승인
3. **Implement**: 기존 패턴 따르기, 한 번에 하나의 기능
4. **Verify**: `pnpm typecheck && pnpm lint && pnpm build`
5. **Commit**: 한국어 설명적 커밋 메시지

## Common Bugs to Avoid

- **RLS 누락**: 새 테이블에 반드시 RLS + `auth.uid()` 정책
- **타입 미갱신**: DB 변경 후 `supabase gen types` 실행
- **Rate Limit**: 네이버 API → books 테이블 캐싱 우선
- **SSE 미종료**: AI 스트림 try-finally로 반드시 종료
- **Server/Client 혼용**: hydration 에러 → 명시적 분리

## Key Commands

```bash
pnpm dev          # 개발 서버 (포트 9000)
pnpm build        # 빌드
pnpm lint         # ESLint
pnpm typecheck    # TypeScript 체크
pnpm test         # Vitest
```

## Documentation Index

- PRD: `docs/PRD-v2.md`
- 아키텍처: `docs/design/architecture.md`
- DB 스키마: `docs/design/database-schema.md`
- API 설계: `docs/design/api-design.md`
- UI/UX: `docs/design/ui-ux.md`
- 로드맵: `docs/development/roadmap.md`
