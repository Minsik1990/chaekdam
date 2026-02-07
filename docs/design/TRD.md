# 기술 요구사항 문서 (TRD)

> PRD의 기능 요구사항을 기술적 관점에서 구체화
> 상세 아키텍처: `docs/design/architecture.md`
> 상세 DB 스키마: `docs/design/database-schema.md`

---

## 1. 성능 요구사항

| 항목                           | 목표    | 측정 방법     | Phase |
| ------------------------------ | ------- | ------------- | ----- |
| First Contentful Paint (FCP)   | < 1.5초 | Lighthouse    | 1     |
| Largest Contentful Paint (LCP) | < 3.0초 | Lighthouse    | 1     |
| 기록 저장 응답 시간            | < 500ms | Network 탭    | 1     |
| 도서 검색 응답 시간            | < 1초   | Network 탭    | 1     |
| AI 첫 토큰 (TTFT)              | < 2초   | SSE 타이밍    | 1     |
| AI 분석 전체 응답              | < 10초  | API 완료 시간 | 1     |
| 페이지 전환                    | < 300ms | 체감 속도     | 1     |

---

## 2. 확장성 요구사항

| 항목      | MVP (Phase 1) | Phase 2    | Phase 3            |
| --------- | ------------- | ---------- | ------------------ |
| MAU       | 50명          | 500명      | 5,000명            |
| DB 용량   | ~100MB        | ~500MB     | Supabase Pro (8GB) |
| 동시 접속 | 10명          | 50명       | 200명              |
| 기록 수   | 1,000건       | 10,000건   | 100,000건          |
| AI 요청   | 100건/일      | 1,000건/일 | 10,000건/일        |

---

## 3. 보안 요구사항

### 3.1 인증/인가

- HTTPS 필수 (Vercel 자동 제공)
- Supabase Auth Magic Link (비밀번호 없음)
- Magic Link 유효 기간: 10분
- 세션 유효 기간: 7일 (Supabase Auth 기본값)
- 초대 코드: DB 기반 (invite_codes 테이블)

### 3.2 데이터 보안

- 모든 테이블 RLS 활성화
- 본인 데이터만 CRUD 가능 (`auth.uid() = user_id`)
- 공개 기록은 읽기만 허용
- API Key는 환경 변수만 사용 (`.env.local`)
- Service Role Key는 서버 사이드만

### 3.3 API 보안

- 네이버 도서 API: 서버 사이드 프록시 (키 노출 방지)
- Claude API: 서버 사이드만 (API Key 노출 방지)
- Rate Limiting: 네이버 API 초당 10건 준수

---

## 4. 인프라 제약사항

| 항목              | 제약                  | 대응                                     |
| ----------------- | --------------------- | ---------------------------------------- |
| Supabase DB       | 500MB (Free)          | 이미지 URL만 저장, AI 로그 정리          |
| Supabase Storage  | 1GB (Free)            | 프로필 아바타만, 책 표지는 외부 URL      |
| Supabase 비활성   | 7일 → 일시정지        | GitHub Actions cron (3일마다)            |
| Vercel 대역폭     | 100GB/월 (Hobby)      | next/image 최적화, 외부 이미지 직접 링크 |
| Vercel Serverless | 10초 타임아웃 (Hobby) | AI 요청은 SSE 스트리밍으로 처리          |

---

## 5. 외부 API 제약

| API               | 제약                   | 대응                                        |
| ----------------- | ---------------------- | ------------------------------------------- |
| 네이버 도서       | 초당 10건, 일 25,000건 | books 테이블 캐싱, Rate Limit 에러 핸들링   |
| Claude Sonnet 4.5 | ~$3/1M input tokens    | Prompt Caching (90% 절감), ai_contents 캐싱 |
| Claude Haiku 4.5  | ~$1/1M input tokens    | 대화형 인터뷰에만 사용                      |
| Supabase Auth     | Magic Link 이메일 한도 | 프로덕션 시 커스텀 SMTP 설정                |

---

## 6. 기술 스택 상세

### Frontend

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Runtime**: React 19.2.3
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI + Lucide Icons
- **Font**: Pretendard Variable (로컬)

### Backend

- **Database**: Supabase PostgreSQL 17
- **Auth**: Supabase Auth (Magic Link)
- **Storage**: Supabase Storage (Phase 2)
- **Client**: `@supabase/ssr` + `@supabase/supabase-js`
- **API**: Next.js API Routes

### AI

- **Provider**: Anthropic
- **분석/요약**: `claude-sonnet-4-5-20250929`
- **대화/질문**: `claude-haiku-4-5-20251001`
- **SDK**: `@anthropic-ai/sdk`
- **스트리밍**: Server-Sent Events (SSE)
- **캐싱**: Prompt Caching (`cache_control: ephemeral`)

### 배포

- **호스팅**: Vercel Hobby
- **CI**: GitHub Actions (lint, typecheck, build)
- **모니터링**: Vercel Analytics (내장)

---

## 7. 테스트 요구사항

### 7.1 커버리지 목표

| 레이어      | 목표               | 도구         | Phase |
| ----------- | ------------------ | ------------ | ----- |
| 유닛 테스트 | 핵심 유틸/로직     | Vitest       | 1     |
| E2E 테스트  | 핵심 시나리오 3개  | Playwright   | 1     |
| 통합 테스트 | AI API, 네이버 API | Vitest + MSW | 2     |

### 7.2 필수 E2E 시나리오

1. **인증 플로우**: 초대 코드 → Magic Link → 온보딩 → 홈
2. **기록 작성**: 도서 검색 → 기록 입력 → 저장 → 확인
3. **모임 관리**: 모임 생성 → 세션 추가 → 감상 작성

---

## 8. 브라우저/디바이스 지원

### 브라우저

| 브라우저 | 최소 버전     |
| -------- | ------------- |
| Chrome   | 최신 2개 버전 |
| Safari   | iOS 15+       |
| Firefox  | 최신 2개 버전 |
| Edge     | 최신 2개 버전 |

### 디바이스

| 디바이스            | 해상도         | 우선순위                |
| ------------------- | -------------- | ----------------------- |
| 모바일 (iPhone 12+) | 320px ~ 480px  | **최우선**              |
| 태블릿              | 768px ~ 1024px | Phase 2                 |
| 데스크톱            | 1024px+        | 중앙 정렬 (max-w-480px) |

---

## 9. 접근성 (Accessibility)

| 항목              | 기준             | 구현 상태                                     |
| ----------------- | ---------------- | --------------------------------------------- |
| 색상 대비         | WCAG 2.1 Level A | 포레스트그린 #2D6A4F → 대비비 확인 필요       |
| 키보드 네비게이션 | Tab/Enter/Esc    | StarRating, BottomNav 구현                    |
| ARIA 레이블       | 인터랙티브 요소  | StarRating aria-label, BottomNav aria-current |
| 시맨틱 HTML       | 구조적 마크업    | header, main, nav 사용                        |
| 포커스 관리       | 모달/다이얼로그  | Radix UI 자동 처리                            |

---

## 10. 모니터링 & 로깅

### 필수 모니터링

| 항목      | 도구                 | 수집 데이터                      |
| --------- | -------------------- | -------------------------------- |
| 페이지 뷰 | Vercel Analytics     | URL, User Agent, Core Web Vitals |
| API 에러  | Vercel Functions Log | Endpoint, 에러 메시지            |
| AI 비용   | Anthropic Console    | 모델, 토큰 수                    |
| DB 사용량 | Supabase Dashboard   | Storage, 커넥션 수               |

### 알림 임계값

| 지표                 | 임계값    | 주기      |
| -------------------- | --------- | --------- |
| DB 사용량            | > 450MB   | 주간 확인 |
| 대역폭               | > 80GB/월 | 주간 확인 |
| AI 비용              | > $40/월  | 월간 확인 |
| Keep-Alive cron 실패 | 1회       | 실행 시   |
