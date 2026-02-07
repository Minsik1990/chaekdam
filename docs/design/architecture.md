# 아키텍처 & 프로젝트 구조

> 최종 업데이트: 2026-02-07 (v1.0)

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│                  Next.js 15 (App Router)                 │
│         SSR + Client Components + Server Actions         │
└─────────────────┬───────────────────┬───────────────────┘
                  │                   │
                  ▼                   ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│   Vercel (Hosting)   │   │    Supabase (BaaS)          │
│                      │   │                             │
│  - SSR/SSG           │   │  - PostgreSQL (DB)          │
│  - API Routes        │   │  - Auth (카카오 로그인)      │
│  - Edge Functions    │   │  - Storage (보조)           │
│  - Image CDN         │   │  - Realtime (Phase 3)      │
│  - Preview Deploy    │   │  - Edge Functions           │
└──────────┬───────────┘   └──────────┬──────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐    ┌──────────────────────────────┐
│  Claude API      │    │  External APIs               │
│                  │    │                              │
│  - Haiku 4.5     │    │  - 네이버 도서 검색 API       │
│  - Sonnet 4.5    │    │  - 알라딘 도서 API            │
│  - Streaming     │    │  - 정보나루 API               │
│  - Prompt Cache  │    │  - 카카오 도서 API (폴백)      │
└──────────────────┘    └──────────────────────────────┘

┌──────────────────┐
│  Cloudflare R2   │
│                  │
│  - 모임 사진     │
│  - 10GB 무료     │
│  - Egress 무료   │
└──────────────────┘
```

---

## 2. 프로젝트 구조

```
mingdle/
├── docs/                       # 프로젝트 문서
├── ref/                        # 레퍼런스 자료
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 홈페이지
│   │   ├── globals.css         # 글로벌 스타일
│   │   ├── (auth)/             # 인증 관련 라우트
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts    # OAuth 콜백
│   │   ├── groups/             # 독서 모임
│   │   │   ├── page.tsx        # 모임 목록
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # 모임 생성
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 모임 상세
│   │   │       ├── sessions/   # 세션 관리
│   │   │       └── settings/   # 모임 설정
│   │   ├── sessions/           # 독서 세션
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 세션 상세
│   │   └── api/                # API Routes
│   │       ├── books/          # 도서 검색
│   │       │   └── search/
│   │       │       └── route.ts
│   │       ├── agent/          # AI 에이전트
│   │       │   └── chat/
│   │       │       └── route.ts
│   │       └── upload/         # 파일 업로드
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   ├── header.tsx
│   │   │   ├── nav.tsx
│   │   │   └── footer.tsx
│   │   └── features/           # 비즈니스 컴포넌트
│   │       ├── groups/         # 모임 관련
│   │       ├── sessions/       # 세션 관련
│   │       ├── books/          # 도서 관련
│   │       ├── reviews/        # 후기 관련
│   │       └── agent/          # AI 에이전트 관련
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # 브라우저 클라이언트
│   │   │   ├── server.ts       # 서버 클라이언트
│   │   │   └── middleware.ts   # Auth 미들웨어
│   │   ├── api/
│   │   │   ├── naver-books.ts  # 네이버 도서 API
│   │   │   ├── aladin.ts       # 알라딘 API
│   │   │   └── cache.ts        # API 결과 캐싱
│   │   └── claude/
│   │       ├── client.ts       # Claude API 클라이언트
│   │       ├── prompts.ts      # 시스템 프롬프트
│   │       └── cache.ts        # 응답 캐싱
│   ├── hooks/                  # 커스텀 React 훅
│   ├── types/                  # TypeScript 타입 정의
│   └── utils/                  # 유틸리티 함수
├── supabase/
│   ├── migrations/             # DB 마이그레이션
│   └── seed.sql                # 시드 데이터
├── public/                     # 정적 파일
├── database.types.ts           # Supabase 자동 생성 타입
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI 파이프라인
│       └── keep-alive.yml      # Supabase 일시정지 방지
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 데이터 흐름

### 3.1 인증 플로우
```
유저 → 카카오 로그인 버튼 → Supabase Auth → 카카오 OAuth
→ 콜백 URL → Supabase 세션 생성 → 리다이렉트
```

### 3.2 도서 검색 플로우
```
유저 검색 → API Route → books 테이블 캐시 확인
  → 캐시 있음: DB에서 반환
  → 캐시 없음: 네이버 API 호출 → DB 캐싱 → 반환
```

### 3.3 AI 에이전트 채팅 플로우
```
유저 메시지 → API Route → 컨텍스트 구성 (책 정보 + 모임 히스토리)
→ ai_contents 캐시 확인 → Claude API (스트리밍)
→ 응답 스트리밍 → 대화 이력 DB 저장
```

### 3.4 미디어 업로드 플로우 (Phase 2)
```
유저 사진 선택 → 클라이언트 리사이즈 → API Route
→ Cloudflare R2 업로드 → URL 반환 → session_media 테이블 저장
```

---

## 4. 보안 설계

### Row Level Security (RLS)
- 모든 테이블에 RLS 정책 적용
- 모임 멤버만 모임 데이터 접근 가능
- 본인 리뷰만 수정/삭제 가능

### API 키 관리
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Claude: `ANTHROPIC_API_KEY`
- 네이버: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- Cloudflare: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- 모두 Vercel 환경 변수로 관리

### 인증
- Supabase Auth + 카카오 OAuth
- 서버 컴포넌트에서 세션 검증
- API Routes에서 인증 미들웨어 적용

---

## 5. 성능 최적화

| 영역 | 전략 |
|------|------|
| 이미지 | Next.js Image 컴포넌트 (자동 최적화 + lazy loading) |
| API | 도서 검색 결과 DB 캐싱, AI 응답 캐싱 |
| 렌더링 | Server Components (기본) + Client Components (인터랙션) |
| 번들 | Tree shaking, 코드 스플리팅 (Next.js 자동) |
| DB | 인덱스 최적화, 쿼리 최소화 |
