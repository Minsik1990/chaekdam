# 기술 스택 & 개발 도구

> 최종 업데이트: 2026-02-07 (v1.0)

---

## 1. 최적 기술 스택

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
UI:         shadcn/ui (Maia 스타일) + Radix UI + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth + Storage + Realtime)
ORM:        Supabase JS Client + supabase gen types (타입 자동생성)
배포:       Vercel (Hobby → 필요 시 Pro)
LLM:        Claude API (Haiku 4.5 메인, Sonnet 4.5 고급 분석)
이미지:     Cloudflare R2 (무료 10GB) + Supabase Storage (보조)
CI/CD:      GitHub Actions (Public 레포 = 무제한)
테스트:     Vitest (단위) + Playwright (E2E)
```

---

## 2. 기술 선택 근거

### Next.js 15 (App Router)
- **이유**: React 기반 풀스택 프레임워크, Vercel과 최적 통합
- **장점**: SSR/SSG, API Routes, Server Components, 이미지 최적화
- **대안 비교**: Remix (Vercel 통합 약함), Nuxt (Vue 생태계)

### Supabase
- **이유**: Firebase 대안, PostgreSQL 기반, 관계형 DB 필요
- **장점**: Auth, Storage, Realtime, Edge Functions 통합
- **대안 비교**: Firebase (NoSQL 한계), PlanetScale (Storage/Auth 없음)

### Tailwind CSS v4
- **이유**: 유틸리티 퍼스트 CSS, 빠른 프로토타이핑
- **장점**: shadcn/ui와 완벽 호환, 번들 사이즈 최적화

### shadcn/ui (Maia 스타일)
- **이유**: 복사-붙여넣기 방식, 완전한 커스터마이징 가능
- **장점**: Radix UI 기반 접근성, Maia 스타일로 둥근 디자인
- **대안 비교**: MUI (무겁고 커스터마이징 어려움), Ant Design (중국풍)

### Claude API
- **이유**: 한국어 성능 우수, 프롬프트 캐싱으로 비용 절감
- **장점**: Haiku는 저렴, Sonnet은 고품질 분석
- **대안**: Gemini Flash-Lite (무료 백업)

### Cloudflare R2
- **이유**: 10GB 무료, Egress 무료 (S3 호환)
- **장점**: Supabase Storage(1GB)보다 10배 넉넉

---

## 3. 도서 API

| API | 일일 제한 | 장점 | 용도 |
|-----|----------|------|------|
| **네이버 도서** | 25,000회 | 국내 도서 풍부, 빠른 응답 | 메인 검색 |
| **알라딘** | 5,000회 | 베스트셀러, ISBN 상세 정보 | 큐레이션, 상세 |
| **정보나루** | 무제한 | 대출 인기도, 25억건 데이터 | 추천, 트렌드 |
| **카카오 도서** | 쿼터제 | JSON 깔끔, REST 친화적 | 폴백 |

### API 캐싱 전략
- 도서 검색 결과를 `books` 테이블에 캐싱 (ISBN 기준)
- 동일 ISBN 재검색 시 DB에서 반환 → API 호출 절약
- 캐시 만료: 30일 (표지 URL 등 변경 가능성)

---

## 4. MCP 서버 활용

| MCP | 용도 | 기대 효과 |
|-----|------|----------|
| **Supabase MCP** | 자연어로 DB 스키마 설계, 마이그레이션 자동 생성 | DB 작업 시간 80% 단축 |
| **Context7 MCP** | Next.js/Supabase 최신 문서 실시간 참조 | 환각 없는 정확한 코드 |
| **Playwright MCP** | 자연어로 E2E 테스트 자동 생성 | 테스트 작성 시간 70% 단축 |

---

## 5. AI 코딩 도구

| 도구 | 무료 한도 | 용도 |
|------|----------|------|
| **Claude Code** (현재 사용) | - | 메인 개발 도구 |
| **v0.dev** | 월 200 크레딧 | UI 컴포넌트 프로토타이핑 |
| **GitHub Copilot Free** | 월 2,000 완성 | 코드 자동완성 |

---

## 6. 개발 워크플로우

```
1. Vercel 공식 Next.js+Supabase 템플릿으로 프로젝트 초기화
2. shadcn/ui init + 필요 컴포넌트 추가 (npx shadcn add)
3. Supabase MCP로 DB 스키마 자연어 설계 → 마이그레이션 자동 생성
4. supabase gen types → TypeScript 타입 자동 생성
5. Context7 MCP로 최신 API 문서 참조하며 개발
6. Playwright MCP로 E2E 테스트 자동 생성
7. Git push → Vercel 자동 배포
```

---

## 7. 테스트 전략

| 종류 | 도구 | 대상 |
|------|------|------|
| 단위 테스트 | Vitest | 유틸 함수, API 래퍼, 컴포넌트 |
| E2E 테스트 | Playwright | 로그인 플로우, CRUD 작업, 핵심 시나리오 |
| 타입 체크 | TypeScript strict | 전체 코드베이스 |
| 린트 | ESLint + Prettier | 코드 스타일 일관성 |

---

## 8. 참고 출처

- [Supabase + Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase MCP](https://supabase.com/features/mcp-server)
- [Context7 MCP](https://www.aitmpl.com/blog/context7-mcp/)
- [shadcn/ui](https://ui.shadcn.com)
- [Vercel 템플릿](https://vercel.com/templates/next.js/supabase)
- [AI Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
