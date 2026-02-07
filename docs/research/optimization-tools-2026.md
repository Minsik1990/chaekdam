# 독독 프로젝트 최적화 도구 종합 리서치

> 작성일: 2026-02-07
> 대상: 독독(DokDok) — Next.js 16 + Supabase + Tailwind v4 + Claude AI
> 목적: MCP 서버, 플러그인, 에이전트 패턴을 활용한 개발 워크플로우 최적화

---

## 현재 상태 분석

### 사용 중인 MCP 서버 (8개)

| MCP 서버            | 용도                   | 토큰 오버헤드 |
| ------------------- | ---------------------- | ------------- |
| supabase (HTTP)     | DB 관리, 마이그레이션  | 중간          |
| context7            | 라이브러리 문서 조회   | 낮음          |
| playwright          | 브라우저 자동화/테스트 | 높음          |
| serena              | 코드 심볼 분석         | 높음          |
| sequential-thinking | 복잡한 의사결정        | 낮음          |
| chrome-devtools     | 브라우저 디버깅        | 높음          |
| claude-in-chrome    | Chrome 내 자동화       | 높음          |
| pencil              | UI 디자인 (.pen)       | 중간          |

### 사용 중인 개발 도구

| 도구                | 역할                                         |
| ------------------- | -------------------------------------------- |
| ESLint 9            | 린팅 (eslint-config-next core-web-vitals/ts) |
| Prettier            | 코드 포맷팅 (+ tailwindcss 플러그인)         |
| Husky + lint-staged | pre-commit 자동 검증                         |
| TypeScript strict   | 타입 체크                                    |
| Vitest              | 유닛 테스트 (미구현)                         |
| Playwright          | E2E 테스트 (미구현)                          |

### 토큰 오버헤드 경고

> MCP 서버당 약 4K~17K 토큰이 tool definition으로 소비됩니다.
> 현재 8개 서버 기준 약 40K~100K+ 토큰이 대화 시작 전에 소모될 수 있습니다.
> Claude Code의 Tool Search(deferred tools)가 85% 완화하지만, 실사용 빈도가 낮은 서버는 비활성화를 권장합니다.

---

## Part 1: 추천 MCP 서버

### Tier 1: 즉시 도입 (높은 ROI)

#### 1. Next.js DevTools MCP (Vercel 공식)

```bash
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest
```

- **기능**: 실행 중인 dev 서버(localhost:9000)에 연결하여 런타임 에러 감지, 라우트/컴포넌트 정보, 라이브 상태 쿼리
- **작동**: `pnpm dev` 실행 후 `http://localhost:9000/_next/mcp`에 자동 연결
- **효과**: Claude가 실시간으로 런타임 에러를 인식하여 디버깅 속도 대폭 향상
- **추천 이유**: Next.js 16 완벽 호환. 1인 개발자에게 "실행 중인 앱의 상태를 AI가 직접 확인"하는 것은 가장 큰 생산성 향상

#### 2. Sentry MCP Server (Sentry 공식)

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

- **인증**: OAuth (자동 프롬프트)
- **기능**: 프로덕션 에러 조회, 스택 트레이스 분석, Seer AI 연동 (수정 추천)
- **효과**: 배포 후 발생하는 에러를 Claude가 직접 가져와 분석 + 수정 코드 제안
- **전제**: Sentry 계정 필요 (무료: 5K 이벤트/월). Vercel 배포 시 Sentry 통합 일반적
- **추천 이유**: 프로덕션 에러를 빠르게 파악 → 수정하는 loop 자동화

### Tier 2: 필요 시 도입

#### 3. GitHub MCP Server (GitHub 공식)

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp
```

- **기능**: Issue 관리, PR 생성/리뷰, 코드 검색, CI/CD 워크플로우 트리거
- **고려**: `gh` CLI로도 충분. Issue 기반 개발 프로세스 도입 시에만

#### 4. Naver Search MCP Server

```bash
claude mcp add naver-search -- npx @isnow890/naver-search-mcp
# + NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수
```

- **기능**: 네이버 검색 API (웹, 뉴스, 블로그, 쇼핑, **도서**) + DataLab 트렌드
- **추천**: 도서 검색 기능 개발/디버깅 시 Claude가 직접 네이버 도서 API 테스트 가능

#### 5. ESLint MCP Server (ESLint 공식)

```json
// .mcp.json
{
  "mcpServers": {
    "eslint": {
      "command": "npx",
      "args": ["@eslint/mcp@latest"]
    }
  }
}
```

- **기능**: Claude가 ESLint 규칙을 직접 조회하고 린팅 결과 실시간 확인
- **고려**: `pnpm lint` 실행으로 충분할 수 있음

### Tier 3: 프로젝트 성장 후 고려

| MCP 서버                | 도입 조건               | 설치                                                                  |
| ----------------------- | ----------------------- | --------------------------------------------------------------------- |
| Memory MCP (Anthropic)  | 세션 간 컨텍스트 유지   | `claude mcp add memory -- npx -y @modelcontextprotocol/server-memory` |
| Figma MCP (Figma)       | Figma 디자인 워크플로우 | `claude mcp add --transport http figma https://mcp.figma.com/mcp`     |
| Notion MCP (Notion)     | Notion 기반 관리        | `claude mcp add --transport http notion https://mcp.notion.com/mcp`   |
| Claude Context (Zilliz) | 대규모 코드베이스       | 벡터 임베딩 기반 시맨틱 검색, 별도 API 키 필요                        |

### 도입하지 않는 것을 권장

| MCP 서버       | 이유                               |
| -------------- | ---------------------------------- |
| Filesystem MCP | Claude Code에 Read/Write/Glob 내장 |
| Git MCP        | `gh` CLI + Bash로 충분             |
| Fetch MCP      | WebFetch/WebSearch 내장            |
| Brave Search   | WebSearch 내장                     |
| Docker MCP     | Vercel 배포이므로 Docker 불필요    |

---

## Part 2: 추천 플러그인 및 개발 도구

### 코드 품질 (ESLint 확장)

| 플러그인                       | 효과                              | 설치                                       |
| ------------------------------ | --------------------------------- | ------------------------------------------ |
| `eslint-plugin-unused-imports` | 미사용 import 자동 제거 + autofix | `pnpm add -D eslint-plugin-unused-imports` |
| `eslint-plugin-perfectionist`  | import 정렬 자동화                | `pnpm add -D eslint-plugin-perfectionist`  |
| `eslint-plugin-jsx-a11y`       | 접근성 규칙 (시맨틱 HTML, aria)   | `pnpm add -D eslint-plugin-jsx-a11y`       |

### 환경변수 안전성

| 도구                 | 효과                                        | 설치                              |
| -------------------- | ------------------------------------------- | --------------------------------- |
| `@t3-oss/env-nextjs` | Zod 기반 env 타입 검증 (빌드타임 에러 방지) | `pnpm add @t3-oss/env-nextjs zod` |

### Supabase 테스트

| 도구                    | 효과                           | 설치                    |
| ----------------------- | ------------------------------ | ----------------------- |
| pgTAP                   | RLS 정책 SQL 단위 테스트       | Supabase 내장 확장      |
| `supabase-test-helpers` | pgTAP 헬퍼 (RLS 테스트 간소화) | DB 패키지 매니저로 설치 |

### 모니터링 (무료)

| 도구                  | 효과                           | 무료 한도       |
| --------------------- | ------------------------------ | --------------- |
| Vercel Web Analytics  | 페이지뷰, 방문자 트래킹        | 2,500 이벤트/월 |
| Vercel Speed Insights | Core Web Vitals, Real UX Score | Hobby 플랜 포함 |
| Sentry (배포 후)      | 에러 트래킹, 성능 모니터링     | 5K 이벤트/월    |

### 성능 최적화

| 도구                    | 효과                                   | 비고                                |
| ----------------------- | -------------------------------------- | ----------------------------------- |
| `@next/bundle-analyzer` | 번들 크기 시각화, 불필요한 의존성 발견 | `pnpm add -D @next/bundle-analyzer` |
| next/font (내장)        | 폰트 자동 최적화, 레이아웃 시프트 방지 | 이미 사용 가능 (Pretendard)         |
| next/image (내장)       | 이미지 자동 최적화, WebP 변환          | 이미 사용 중                        |

---

## Part 3: Claude Code 워크플로우 최적화

### 에이전트 병렬 실행 패턴

```
# 리서치: 여러 방면을 동시에 조사
Task(subagent_type="general-purpose") × 3~5 병렬 → 결과 종합

# 코드 리뷰: 보안/성능/품질 동시 분석
Task(subagent_type="code-reviewer") + Task(subagent_type="security-auditor") 병렬

# 구현 후: 빌드 + 테스트 + 린트 병렬
Bash(pnpm build) + Bash(pnpm lint) + Bash(pnpm typecheck) 병렬
```

### 추천 subagent_type 활용

| subagent_type      | 최적 사용 시나리오               |
| ------------------ | -------------------------------- |
| `Explore`          | 코드베이스 탐색, 파일 구조 파악  |
| `Plan`             | 기능 설계, 아키텍처 결정         |
| `code-reviewer`    | 코드 변경 후 보안/성능/품질 리뷰 |
| `security-auditor` | 보안 취약점 스캔                 |
| `test-writer`      | 유닛/통합/E2E 테스트 작성        |
| `debugger`         | 에러 분석, 원인 추적             |
| `refactorer`       | 코드 개선, 패턴 적용             |
| `general-purpose`  | 웹 검색, 복합 리서치             |

### Agent Teams (실험적 기능)

대규모 작업에서 여러 Claude 인스턴스를 팀으로 운영 가능:

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

- 팀원끼리 직접 메시지 교환 가능
- 공유 태스크 리스트로 자동 조율
- 토큰 비용이 매우 높으므로 대규모 작업에만 사용

### Hooks 자동화

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse:Write": {
      "command": "pnpm lint --fix ${file}"
    },
    "PreCommit": {
      "command": "pnpm typecheck && pnpm lint"
    }
  }
}
```

### 메모리 시스템 최적화

```
~/.claude/projects/-Users-minsikkim-dokdok/memory/
├── MEMORY.md          # 핵심 요약 (200줄 이내, 시스템 프롬프트에 자동 로드)
├── debugging.md       # 디버깅 경험, 해결책
├── patterns.md        # 코드 패턴, 컨벤션
└── decisions.md       # 아키텍처 결정 기록
```

---

## Part 4: 즉시 실행 가능한 액션 플랜

### Phase A: 즉시 (5분)

1. **Next.js DevTools MCP 추가**

   ```bash
   claude mcp add next-devtools -- npx -y next-devtools-mcp@latest
   ```

2. **불필요한 MCP 비활성화 검토**
   - `claude-in-chrome`과 `chrome-devtools`는 기능 중복. 하나만 유지 권장

### Phase B: 이번 주 (30분)

3. **ESLint 플러그인 강화**

   ```bash
   pnpm add -D eslint-plugin-unused-imports eslint-plugin-jsx-a11y
   ```

4. **환경변수 타입 안전성**

   ```bash
   pnpm add @t3-oss/env-nextjs zod
   ```

5. **번들 분석 도구**
   ```bash
   pnpm add -D @next/bundle-analyzer
   ```

### Phase C: MVP 배포 시 (1시간)

6. **Sentry 설정 + MCP 추가**

   ```bash
   pnpm add @sentry/nextjs
   claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
   ```

7. **Vercel Analytics/Speed Insights 활성화**

   ```bash
   pnpm add @vercel/analytics @vercel/speed-insights
   ```

8. **pgTAP RLS 테스트 작성**
   - `supabase/tests/` 디렉토리에 RLS 정책 테스트 SQL 파일 추가

### Phase D: 개발 안정화 후

9. **GitHub MCP 서버** (Issue 기반 개발 시)
10. **Naver Search MCP** (도서 검색 디버깅 시)
11. **메모리 파일 체계화** (debugging.md, patterns.md 추가)

---

## 참고 자료

- [Vercel Next.js DevTools MCP](https://github.com/vercel/next-devtools-mcp)
- [Sentry MCP 공식 문서](https://docs.sentry.io/product/sentry-mcp/)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [MCP 토큰 오버헤드 분석](https://mariogiancini.com/the-hidden-cost-of-mcp-servers-and-when-theyre-worth-it)
- [MCP Tool Search로 토큰 85% 절감](https://www.atcyrus.com/stories/mcp-tool-search-claude-code-context-pollution-guide)
- [Supabase pgTAP 테스트 가이드](https://supabase.com/docs/guides/local-development/testing/overview)
- [T3 Env 문서](https://env.t3.gg/docs/nextjs)
- [Claude Code Agent Teams 문서](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Hooks 문서](https://code.claude.com/docs/en/hooks)
- [ESLint MCP Setup](https://eslint.org/docs/latest/use/mcp)
