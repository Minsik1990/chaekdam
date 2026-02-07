# Changelog

> 프로젝트 주요 변경사항을 버전별로 기록합니다.

---

## v2.0-alpha (2026-02-07) -- v2 전면 개편

### Breaking Changes

- 서비스 컨셉 전환: "독서 모임 중심" -> "개인 독서 기록 중심"
- 인증 방식 변경: 초대 코드 + 쿠키 -> Supabase Auth Magic Link (이메일)
- 디자인 시스템 변경: 밍들레씨 테마 (그린/노랑/핑크) -> 따뜻한 토스 스타일 (코랄 #F4845F)
- AI 에이전트 변경: 캐릭터 페르소나 "밍들레" -> 도구형 조력자 (캐릭터 없음)
- API 변경: `/api/agent/chat` 삭제, 기능별 전용 엔드포인트 분리

### Added

- `docs/PRD-v2.md` -- v2 전체 PRD (기능, 인수 기준, 테스트 전략)
- records 테이블 -- 개인 독서 기록 (content 1000자, quote 500자, rating 1~5, status NOT NULL)
- collections, collection_records 테이블 (Phase 2)
- session_reviews 테이블 (reviews -> session_reviews 변경)
- invite_codes 테이블 (DB 기반 초대 코드)
- 새 API 엔드포인트: `/api/agent/interview`, `/api/agent/summarize`, `/api/agent/topics`, `/api/agent/draft`, `/api/agent/analysis`
- Phase 2 API: `/api/agent/suggest-questions`, `/api/agent/recommend`, `/api/agent/insight`
- 새 컴포넌트: BottomNav, RecordCard, RecordForm, InterviewChat, StarRating, StatusBadge, AgentPanel
- 기록 카드 배경색 6종 (peach, lavender, mint, lemon, rose, sky)
- 하단 탭 5개 (홈/검색/+기록/모임/프로필)
- `src/lib/agent/` 모듈 (client, prompts, stream, cache, types)
- 장애 대응 테이블 (api-design.md)

### Changed

- 라우팅 구조: `(auth)/`, `groups/`, `sessions/` -> `login/`, `onboarding/`, `(main)/*`
- DB 스키마: 12개 테이블 (v1의 8개에서 확장)
- 색상: background #FAFAFA, primary #F4845F, accent #FFB74D, success #66BB6A
- 타이포: 22px/700, 17px/600, 15px/400, 13px/400
- 레이아웃: max-width 480px, 하단 탭 56px + safe-area
- 환경 변수: Cloudflare R2, 알라딘, 정보나루 관련 변수 제거

### Removed

- `docs/design/character.md` -- 밍들레씨 캐릭터 가이드 (v2에서 사용하지 않음)
- 밍들레 에이전트 페르소나
- Cloudflare R2 이미지 저장 (Supabase Storage로 대체)
- 알라딘 API, 정보나루 API (네이버 도서 API만 유지)
- session_media 테이블
- reviews 테이블 (session_reviews로 대체)
- `/api/agent/chat` 엔드포인트
- `/api/upload` 엔드포인트

### Decisions

- ADR-010: Magic Link 인증 채택
- ADR-011: 따뜻한 토스 디자인 시스템 채택
- ADR-012: 개인 기록 중심 전환
- ADR-013: AI 도구형 전환

---

## v1.0.2 (2026-02-07) -- 개발 환경 & 방법론 확립

### Added

- AI-First 개발 방법론 리서치 및 문서화
  - `docs/research/dev-methodology-2026.md` 생성 (PRD 템플릿, CI/CD, 테스트 전략)
  - Spec-Driven Development 워크플로우 채택 (Explore -> Plan -> Implement -> Verify -> Commit)
- Claude Code 환경 최적화
  - `CLAUDE.md` 리서치 기반 최적화 (303줄 -> 66줄, WHY 중심, 포인터 방식)
  - `.claude/agents/supabase-reviewer.md` DB 변경 리뷰 에이전트
  - `.claude/agents/feature-reviewer.md` 기능 코드 리뷰 에이전트
  - `.claude/skills/prd/SKILL.md` PRD 자동 생성 스킬

### Changed

- AI 독서 에이전트 이름 변경: "밍들이" -> "밍들레"

### Decisions

- ADR-005: Spec-Driven Development 방법론 채택
- ADR-006: CLAUDE.md 간결화 원칙

---

## v1.0.1 (2026-02-07) -- 밍들레씨 캐릭터 통합

### Added

- 밍들레씨(@mingdle_seed) 인스타그램 분석 완료
- `docs/design/character.md` 캐릭터 가이드 문서 생성

### Changed

- 색상 팔레트: 보라 계열 -> 밍들레씨 그린(#7CB342) + 노랑(#FFD54F) + 핑크(#FFB5B5)

---

## v1.0 (2026-02-07) -- 초기 리서치 & 문서화

### Added

- 시장 분석 & 경쟁 서비스 리서치 완료
- 비용 분석 완료 (완전 무료 운영 전략)
- 성공 사례 분석 및 공통 패턴 도출
- 기술 스택 확정 (Next.js 15 + Supabase + Vercel + Claude API)
- 아키텍처 설계 (시스템 구조도, 폴더 구조, 데이터 흐름)
- DB 스키마 초안 (8개 테이블 + RLS)
- 외부 API 연동 설계
- UI/UX 디자인 방향 설정
- docs/ 문서 체계 구축 (13개 문서)

### Decisions

- ADR-001: Next.js 15 App Router 채택
- ADR-002: Supabase 선택 (Firebase 대신)
- ADR-003: Claude API 선택 (Sonnet 4.5 단일 모델)
- ADR-004: shadcn/ui Maia 스타일 채택
