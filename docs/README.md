# Mingdle 프로젝트 문서

> **Mingdle** - 독서 모임원들이 모임 내용을 보고, 후기를 남기고, 발제문/사진/영상을 공유하며 추억할 수 있는 웹앱

---

## 문서 인덱스

### research/ - 리서치

| 문서                                                        | 설명                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| [market-analysis.md](research/market-analysis.md)           | 시장 분석 & 경쟁 서비스 (Repov, 트레바리, StoryGraph 등) |
| [cost-analysis.md](research/cost-analysis.md)               | 비용 분석 (무료 운영 전략, 플랜 한도, 시뮬레이션)        |
| [success-cases.md](research/success-cases.md)               | 성공 사례 (Letterboxd, Strava, 당근마켓, 오늘의집 등)    |
| [tech-stack.md](research/tech-stack.md)                     | 기술 스택 & 도구 (MCP, AI 코딩 도구, API 비교)           |
| [dev-methodology-2026.md](research/dev-methodology-2026.md) | AI-First 개발 방법론, PRD 템플릿, CI/CD, 테스트 전략     |

### design/ - 설계

| 문서                                            | 설명                                                   |
| ----------------------------------------------- | ------------------------------------------------------ |
| [architecture.md](design/architecture.md)       | 아키텍처 & 프로젝트 구조                               |
| [database-schema.md](design/database-schema.md) | DB 스키마 (Supabase MCP로 업데이트 예정)               |
| [api-design.md](design/api-design.md)           | 외부 API 연동 설계 (네이버, 알라딘, Claude 등)         |
| [ui-ux.md](design/ui-ux.md)                     | UI/UX 디자인 방향 (토스/카카오/Repov 스타일)           |
| [character.md](design/character.md)             | 밍들레씨 캐릭터 가이드 (외형, 색상, 톤앤매너, UI 적용) |

### development/ - 개발

| 문서                                     | 설명                                                |
| ---------------------------------------- | --------------------------------------------------- |
| [roadmap.md](development/roadmap.md)     | Phase별 로드맵 & 체크리스트 (항상 최신 상태 유지)   |
| [changelog.md](development/changelog.md) | 주요 마일스톤/변경 기록 (날짜별)                    |
| [decisions.md](development/decisions.md) | 기술 결정 기록 (ADR: Architecture Decision Records) |

### guides/ - 가이드

| 문서                                  | 설명                            |
| ------------------------------------- | ------------------------------- |
| [setup.md](guides/setup.md)           | 프로젝트 셋업 가이드            |
| [deployment.md](guides/deployment.md) | 배포 가이드 (Vercel + Supabase) |

---

## 핵심 기술 스택

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
UI:         shadcn/ui (Maia 스타일) + Radix UI + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth + Storage + Realtime)
LLM:        Claude API (Haiku 4.5 + Sonnet 4.5)
이미지:     Cloudflare R2 (무료 10GB)
배포:       Vercel (Hobby) + GitHub Actions
```

---

## 버전 관리

| 버전       | 설명                       | 날짜       |
| ---------- | -------------------------- | ---------- |
| **v1.0.2** | 개발 환경 & 방법론 확립    | 2026-02-07 |
| **v1.0.1** | 밍들레씨 캐릭터 통합       | 2026-02-07 |
| **v1.0**   | 초기 리서치 & 문서화       | 2026-02-07 |
| v1.1~      | Phase 1 MVP 개발           | 예정       |
| v2.0       | Phase 2 미디어 & AI 고도화 | 예정       |
| v3.0       | Phase 3 고도화             | 예정       |

자세한 변경 내역은 [changelog.md](development/changelog.md)를 참고하세요.

---

## 문서 관리 원칙

1. **roadmap.md**: 항상 최신 상태 유지 (완료 항목 `[x]` 표시)
2. **changelog.md**: 버전별 주요 변경사항 기록
3. **decisions.md**: 기술 결정과 근거 기록
4. **나머지 문서**: 필요할 때 직접 수정 (Git이 이력 보관)
5. **Git tag**: 버전 마일스톤에 `git tag v1.0` 등으로 태그
