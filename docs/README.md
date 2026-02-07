# DokDok 프로젝트 문서

> **독독 (DokDok)** -- 독서를 두드리다. 읽고, 느끼고, 기록하다.
>
> 개인 독서 기록이 메인이며, 독서 모임은 부가 기능으로 제공하는 웹앱.
> AI 에이전트가 요약, 토론 주제, 발제문 초안 등을 도구 형태로 지원.

---

## 문서 인덱스

### PRD

| 문서                   | 설명                                                   |
| ---------------------- | ------------------------------------------------------ |
| [PRD-v2.md](PRD-v2.md) | v2 전체 PRD (기능, 인수 기준, 테스트 전략, Phase 분리) |

### planning/ -- 비즈니스 기획

| 문서                                              | 설명                                            |
| ------------------------------------------------- | ----------------------------------------------- |
| [project-status.md](planning/project-status.md)   | 진행 현황 종합 대시보드 (roadmap + 코드 대조)   |
| [user-scenarios.md](planning/user-scenarios.md)   | 상세 유저 시나리오 (4개 페르소나, Step-by-Step) |
| [user-flows.md](planning/user-flows.md)           | 유저 플로우 (Mermaid 다이어그램)                |
| [business-model.md](planning/business-model.md)   | 비즈니스 모델 (수익화, 성장 전략, KPI)          |
| [risk-management.md](planning/risk-management.md) | 리스크 관리 (기술/비즈니스/운영)                |

### design/ -- 설계

| 문서                                            | 설명                                          |
| ----------------------------------------------- | --------------------------------------------- |
| [TRD.md](design/TRD.md)                         | 기술 요구사항 (성능, 보안, 제약, 테스트 기준) |
| [architecture.md](design/architecture.md)       | 아키텍처, 프로젝트 구조, 데이터 흐름          |
| [database-schema.md](design/database-schema.md) | DB 스키마 (13개 테이블, RLS 정책)             |
| [api-design.md](design/api-design.md)           | API 설계 (네이버 도서, AI 에이전트)           |
| [ui-ux.md](design/ui-ux.md)                     | UI/UX 디자인 시스템 (포레스트그린 테마)       |

### development/ -- 개발

| 문서                                     | 설명                                 |
| ---------------------------------------- | ------------------------------------ |
| [roadmap.md](development/roadmap.md)     | Phase별 로드맵 & Step 0~8 체크리스트 |
| [changelog.md](development/changelog.md) | 버전별 변경 기록                     |
| [decisions.md](development/decisions.md) | 기술 결정 기록 (ADR-001 ~ ADR-013)   |

### features/ -- 기능별 스펙

| 문서                                     | 설명                             |
| ---------------------------------------- | -------------------------------- |
| [features/README.md](features/README.md) | 기능별 스펙 작성 가이드 & 템플릿 |
| `features/{기능명}/v1-spec.md`           | 큰 작업 시 기획서 (Phase 2부터)  |

### operations/ -- 운영

| 문서                                                    | 설명                                 |
| ------------------------------------------------------- | ------------------------------------ |
| [monitoring.md](operations/monitoring.md)               | 모니터링 (Vercel, Supabase, AI 비용) |
| [incident-response.md](operations/incident-response.md) | 장애 대응 Runbook (P0~P3 시나리오)   |
| [cost-optimization.md](operations/cost-optimization.md) | 비용 최적화 (무료 플랜 유지 전략)    |

### guides/ -- 가이드

| 문서                                  | 설명                                         |
| ------------------------------------- | -------------------------------------------- |
| [setup.md](guides/setup.md)           | 프로젝트 셋업 가이드 (Magic Link, 환경 변수) |
| [deployment.md](guides/deployment.md) | 배포 가이드 (Vercel + Supabase)              |

### research/ -- 리서치

| 문서                                                        | 설명                             |
| ----------------------------------------------------------- | -------------------------------- |
| [market-analysis.md](research/market-analysis.md)           | 시장 분석 & 경쟁 서비스          |
| [cost-analysis.md](research/cost-analysis.md)               | 비용 분석 (무료 운영 전략)       |
| [success-cases.md](research/success-cases.md)               | 성공 사례 분석                   |
| [tech-stack.md](research/tech-stack.md)                     | 기술 스택 & 도구                 |
| [dev-methodology-2026.md](research/dev-methodology-2026.md) | AI-First 개발 방법론, PRD 템플릿 |

---

## 핵심 기술 스택

```
Frontend:   Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4
UI:         shadcn/ui + Radix UI + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth Magic Link + Storage)
AI:         Claude Sonnet 4.5 + Haiku 4.5 (Anthropic API)
도서 API:   네이버 도서 검색 API
배포:       Vercel (Hobby) + GitHub Actions
Font:       Pretendard
```

---

## v2 핵심 변경 (v1 대비)

| 항목        | v1                             | v2                                       |
| ----------- | ------------------------------ | ---------------------------------------- |
| 서비스 핵심 | 독서 모임                      | 개인 독서 기록                           |
| 인증        | 초대 코드 + 쿠키               | Magic Link (이메일)                      |
| 디자인      | 밍들레씨 테마 (그린/노랑/핑크) | 포레스트그린 테마 (포레스트그린 #2D6A4F) |
| AI 에이전트 | 캐릭터 페르소나 "밍들레"       | 도구형 조력자 (캐릭터 없음)              |
| 이미지 저장 | Cloudflare R2                  | Supabase Storage                         |
| 도서 API    | 네이버 + 알라딘 + 정보나루     | 네이버 (1개만)                           |

---

## 버전 관리

| 버전           | 설명                     | 날짜       |
| -------------- | ------------------------ | ---------- |
| **v2.0-beta**  | Phase 1 MVP 개발 (90%)   | 2026-02-07 |
| **v2.0-alpha** | v2 설계 & 문서 전면 개편 | 2026-02-07 |
| **v1.0**       | 초기 리서치 & 문서화     | 2026-02-07 |
| v2.0           | Phase 1 MVP 출시         | 2026-02-21 |
| v2.1           | Phase 2 확장             | 2026-03    |
| v3.0           | Phase 3 고도화           | 미정       |

자세한 변경 내역은 [changelog.md](development/changelog.md)를 참고하세요.

---

## 문서 관리 원칙

1. **roadmap.md**: 항상 최신 상태 유지 (완료 항목 `[x]` 표시)
2. **project-status.md**: roadmap + 실제 코드 대조 현황
3. **changelog.md**: 버전별 주요 변경사항 기록
4. **decisions.md**: 기술 결정과 근거 기록
5. **features/**: 큰 작업 시 기획서 작성, 이전 버전은 수정하지 않음
6. **나머지 문서**: 필요할 때 직접 수정 (Git이 이력 보관)
