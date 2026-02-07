# 독독(DokDok) 프로젝트 컨텍스트

## 개요

- **프로젝트**: 독독 — 개인 독서 기록 웹앱
- **Stack**: Next.js 16 + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (project_id: nxofxjputwsgbujbjlus)
- **AI**: Claude Sonnet 4.5 (분석) + Haiku 4.5 (대화)
- **배포**: Vercel
- **디자인**: 독서/자연 테마 — 포레스트그린(#2D6A4F) + 크래프트베이지(#C9A96E)

## 현재 상태 (2026-02-07)

- Phase 0 (리서치 & 설계): 완료
- Phase 1 MVP (Step 0~8): ~90% 완성 (Step 0~6 완료, Step 7~8 부분 완료)
- v2.0-alpha 설계 완료, v2.0-beta 구현 중
- 문서 체계 전면 정비 완료 (14개 파일 생성/수정)

## Phase 1 잔여 작업 (우선순위별)

- **P0**: Vercel 배포 연동, 빈 상태(Empty State) UI
- **P1**: 반응형 검증, E2E 테스트 (Playwright)
- **P2**: 성능 최적화, 단위 테스트
- **기술 부채**: 테스트 커버리지 0%, v1/v2 레거시 공존, DB 스키마 문서 불일치

## 주요 디렉토리

- `src/app/` — App Router 페이지/API
- `src/components/ui/` — shadcn/ui 컴포넌트
- `src/components/features/` — 비즈니스 컴포넌트
- `src/lib/agent/` — AI 에이전트 모듈
- `src/lib/supabase/` — Supabase 클라이언트
- `docs/` — 설계 문서, PRD, 로드맵

## 핵심 라우트

- `/(main)/` — 메인 레이아웃 (하단 탭)
- `/(main)/record/` — 독서 기록
- `/(main)/groups/` — 독서 모임
- `/(main)/search/` — 도서 검색
- `/(main)/profile/` — 프로필
- `/login`, `/onboarding`, `/invite` — 인증 플로우
- `/api/agent/*` — AI 에이전트 API (5개)
- `/api/books/search` — 도서 검색 API

## CRITICAL

- Supabase project_id: nxofxjputwsgbujbjlus 전용
- careguardian 조직 접근 금지
- RLS 필수, 타입 재생성 필수
