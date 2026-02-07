# Changelog

> 프로젝트 주요 변경사항을 버전별로 기록합니다.

---

## v1.0.2 (2026-02-07) - 개발 환경 & 방법론 확립

### Added

- AI-First 개발 방법론 리서치 및 문서화
  - `docs/research/dev-methodology-2026.md` 생성 (PRD 템플릿, CI/CD, 테스트 전략)
  - Spec-Driven Development 워크플로우 채택 (Explore → Plan → Implement → Verify → Commit)
- Claude Code 환경 최적화
  - `CLAUDE.md` 리서치 기반 최적화 (303줄 → 66줄, WHY 중심, 포인터 방식)
  - `.claude/agents/supabase-reviewer.md` DB 변경 리뷰 에이전트
  - `.claude/agents/feature-reviewer.md` 기능 코드 리뷰 에이전트
  - `.claude/skills/prd/SKILL.md` PRD 자동 생성 스킬

### Changed

- AI 독서 에이전트 이름 변경: "밍들이" → **"밍들레"** (전체 문서 일괄 반영)
  - CLAUDE.md, character.md, ui-ux.md, api-design.md, roadmap.md, decisions.md, changelog.md

### Decisions

- ADR-005: Spec-Driven Development 방법론 채택 (Addy Osmani 2026 워크플로우)
- ADR-006: CLAUDE.md 간결화 원칙 (50-100줄, 상세는 docs/ 포인터)

---

## v1.0.1 (2026-02-07) - 밍들레씨 캐릭터 통합

### Added

- 밍들레씨(@mingdle_seed) 인스타그램 분석 완료
  - 캐릭터 외형, 색상 팔레트, 톤앤매너, 표정 변화 분석
- `docs/design/character.md` 캐릭터 가이드 문서 생성
  - UI 적용 가이드 (에이전트 아바타, 빈 상태, 축하/격려 애니메이션)
  - 이미지 에셋 목록 정리
  - "밍들레" 독서 에이전트 페르소나 연계 설계

### Changed

- `docs/design/ui-ux.md` 색상 팔레트 변경
  - 보라 계열 → 밍들레씨 그린(#7CB342) + 민들레꽃 노랑(#FFD54F) + 볼터치 핑크(#FFB5B5)
- UI/UX 전반에 밍들레씨 캐릭터 활용 방안 반영
  - 로그인 화면, 빈 상태, 마이크로 인터랙션, 에이전트 채팅 UI
- UX 카피를 밍들레씨 톤앤매너로 조정

---

## v1.0 (2026-02-07) - 초기 리서치 & 문서화

### Added

- 시장 분석 & 경쟁 서비스 리서치 완료
  - Repov, 트레바리, StoryGraph, Letterboxd, Strava, 당근마켓, 오늘의집 분석
- 비용 분석 완료 (완전 무료 운영 전략)
  - Supabase Free + Vercel Hobby + GitHub Actions (Public) 조합
  - Claude API (Haiku/Sonnet) LLM 비용 전략
  - Cloudflare R2 이미지 저장 전략
- 성공 사례 분석 및 공통 패턴 도출
- 기술 스택 확정
  - Next.js 15 + Supabase + Vercel + Claude API
  - shadcn/ui (Maia 스타일) + Tailwind CSS v4
- 아키텍처 설계
  - 시스템 구조도, 프로젝트 폴더 구조, 데이터 흐름
- DB 스키마 초안
  - 8개 테이블 + RLS 정책 + 프로필 트리거
- 외부 API 연동 설계
  - 네이버/알라딘/정보나루 도서 API
  - Claude API (스트리밍 + 캐싱)
  - Cloudflare R2 이미지 업로드
- UI/UX 디자인 방향 설정
  - 카카오/토스/Repov 스타일 융합
  - 따뜻한 + 귀여운 감성
- AI 독서 에이전트 "밍들레" 컨셉 설계
- docs/ 문서 체계 구축 (13개 문서)

### Decisions

- ADR-001: Next.js 15 App Router 채택
- ADR-002: Supabase 선택 (Firebase 대신)
- ADR-003: Claude API 선택 (Haiku 메인 + Sonnet 보조)
- ADR-004: shadcn/ui Maia 스타일 채택

---

## v1.1 (예정) - Phase 1 MVP 시작

### Planned

- Vercel 공식 Next.js + Supabase 템플릿으로 프로젝트 초기화
- Supabase Auth + 카카오 소셜 로그인
- DB 스키마 적용 (Supabase MCP)
- 독서 모임 CRUD
- 네이버 도서 검색 API 연동

---

## v2.0 (예정) - 미디어 & 에이전트 고도화

### Planned

- Cloudflare R2 사진 업로드
- YouTube 임베딩
- AI 에이전트 v2 (모임 준비/정리 도우미)
- 타임라인 뷰

---

## v3.0 (예정) - 고도화

### Planned

- Supabase Realtime 실시간 토론
- AI 에이전트 v3 (개인 독서 코치)
- 독서 통계 대시보드
- 게이미피케이션
