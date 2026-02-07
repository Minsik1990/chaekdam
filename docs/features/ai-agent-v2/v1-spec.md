# AI 에이전트 V2 스펙

> 작성일: 2026-02-07
> 상태: Draft

## 1. 배경 & 목적

현재 AI 에이전트 시스템(7.2/10)은 기본 기능은 갖추었으나 **데이터 지속성**이 부족하다:

- `agent_conversations` 테이블이 정의만 되고 **전혀 사용되지 않음** (대화 저장 불가)
- `summarize` 결과가 DB에 저장되지 않아 사용자가 **수동으로 복사-붙여넣기** 해야 함
- `topics`, `draft`에 캐싱이 없어 **동일 요청마다 비용 발생** (analysis만 캐싱)
- 대화 도중 새로고침 시 **전체 대화 손실**

이 개선으로 AI가 생성한 모든 콘텐츠를 저장하고, 사용자가 원클릭으로 활용할 수 있게 한다.

## 2. 요구사항

### 기능 요구사항

**Priority 1 (필수)**

- [x] FR-1: 인터뷰 대화를 `agent_conversations`에 저장/복구
- [x] FR-2: 요약 결과를 records에 원클릭 저장 ("감상문으로 저장" 버튼)
- [x] FR-3: topics, draft에 ai_contents 캐싱 적용 (bookId 전달)
- [x] FR-4: 자유 대화(/chat)의 대화 이력 저장

**Priority 2 (중요)**

- [ ] FR-5: 과거 인터뷰 목록 조회 UI (대화 내역 페이지)
- [ ] FR-6: topics 모델을 Haiku로 전환 (비용 최적화)
- [ ] FR-7: 캐시 유효 기간 (30일 후 자동 갱신)

**Priority 3 (Phase 3)**

- [ ] FR-8: 독서 인사이트 (읽은 책 패턴 분석)
- [ ] FR-9: 개인화 책 추천

### 비기능 요구사항

- 성능: TTFT < 2초 유지, 캐시 히트 시 < 200ms
- 비용: Topics Haiku 전환으로 월 $0.4 절감
- 보안: agent_conversations RLS (본인만 조회)

## 3. 기술 설계

### 3.1 대화 저장 (FR-1, FR-4)

**API 변경: `/api/agent/interview`**

```typescript
// 요청에 conversationId 추가
POST /api/agent/interview
{
  messages: AgentMessage[],
  bookContext?: BookContext,
  conversationId?: string  // 기존 대화 이어갈 때
}

// 응답 후 대화 저장
// 1. conversationId 없으면 새로 생성 (INSERT)
// 2. conversationId 있으면 업데이트 (UPDATE messages)
// 3. 응답 헤더에 X-Conversation-Id 포함
```

**API 변경: `/api/agent/chat`**

```typescript
// 동일 패턴 적용
POST /api/agent/chat
{
  messages: AgentMessage[],
  conversationId?: string
}
```

**새 API: `/api/agent/conversations`**

```typescript
// 대화 목록 조회
GET /api/agent/conversations?type=interview|chat&limit=20

// 특정 대화 조회
GET /api/agent/conversations/[id]
```

### 3.2 요약→기록 저장 (FR-2)

**API 변경: `/api/agent/summarize`**

```typescript
POST /api/agent/summarize
{
  messages: AgentMessage[],
  bookContext?: BookContext,
  conversationId?: string,
  saveAsRecord?: boolean  // true이면 records에 자동 저장
}

// saveAsRecord=true일 때:
// 1. 요약 생성
// 2. records INSERT (content: summary, book_id, status: 'completed')
// 3. agent_conversations.result 업데이트
// 4. 응답에 recordId 포함
```

### 3.3 캐싱 통일 (FR-3)

**API 변경: `/api/agent/topics`**

```typescript
POST /api/agent/topics
{
  bookContext: BookContext,
  bookId: string  // 추가 — 캐싱 키로 사용
}

// 1. getCachedContent(bookId, 'topics') 확인
// 2. 캐시 히트 → JSON 반환 (스트리밍 불필요)
// 3. 캐시 미스 → Haiku로 생성 → setCachedContent() 저장 → 스트리밍
```

**API 변경: `/api/agent/draft`**

```typescript
POST /api/agent/draft
{
  bookContext: BookContext,
  bookId: string,     // 추가
  userNotes?: string
}

// userNotes 없을 때만 캐싱 (notes 있으면 매번 다름)
```

### 3.4 컴포넌트 변경

| 컴포넌트             | 변경 내용                                                      |
| -------------------- | -------------------------------------------------------------- |
| `interview-chat.tsx` | conversationId 상태 관리, "저장" 버튼 추가, 과거 대화 불러오기 |
| `agent-panel.tsx`    | bookId prop 전달, 캐시 상태 표시 (캐시됨/새로 생성)            |
| `chat/page.tsx`      | conversationId 추적, 대화 이력 불러오기                        |

### 3.5 DB 변경

마이그레이션 불필요 — `agent_conversations`와 `ai_contents` 테이블이 이미 존재.
코드에서 미사용 중인 것을 활성화하는 것이 전부.

## 4. UI 설계

### 4.1 인터뷰 대화 — "감상문으로 저장" 버튼

```
┌─────────────────────────────────────┐
│ [AI] 이 책에서 가장 인상적인 부분은? │
│ [나] 주인공이 결단을 내리는 장면...  │
│ [AI] 왜 그 장면이 인상적이었나요?    │
│ [나] 비슷한 경험이 있어서...         │
├─────────────────────────────────────┤
│ [📝 감상문으로 정리하기] [💾 저장]  │
└─────────────────────────────────────┘
```

### 4.2 AgentPanel — 캐시 표시

```
┌─ 토론 주제 | 발제문 | 분석 ─────────┐
│ ✅ 캐시됨 (2026-02-05 생성)          │
│ [다시 생성하기]                       │
│                                       │
│ 1. 주인공의 선택과 도덕적 딜레마     │
│ 2. 시대적 배경이 인물에 미치는 영향  │
│ ...                                   │
└───────────────────────────────────────┘
```

## 5. 구현 계획

### Step 1: 대화 저장 인프라 (agent_conversations 활성화)

- `src/lib/agent/conversations.ts` 신규 — 대화 CRUD 유틸
- `/api/agent/conversations/route.ts` 신규 — 대화 목록/조회 API
- `/api/agent/interview/route.ts` 수정 — 대화 저장 추가
- `/api/agent/chat/route.ts` 수정 — 대화 저장 추가

### Step 2: 캐싱 통일

- `/api/agent/topics/route.ts` 수정 — bookId 수신, 캐싱 로직 추가
- `/api/agent/draft/route.ts` 수정 — bookId 수신, 조건부 캐싱
- `src/lib/agent/cache.ts` 수정 — 캐시 유효 기간 체크 추가
- `src/components/features/agent-panel.tsx` 수정 — bookId 전달, 캐시 상태 UI

### Step 3: 요약→기록 저장

- `/api/agent/summarize/route.ts` 수정 — saveAsRecord 옵션
- `src/components/features/interview-chat.tsx` 수정 — "저장" 버튼, conversationId 관리

### Step 4: 대화 내역 UI

- `src/app/(main)/chat/page.tsx` 수정 — 대화 이력 탭 추가
- 과거 인터뷰/채팅 목록 표시

### Step 5: 모델 최적화

- `/api/agent/topics/route.ts` — 모델을 Haiku로 변경

### Step 6: 검증

- typecheck + lint + build
- AI API 수동 테스트 (대화 저장, 캐싱, 기록 저장)

## 6. 인수 기준

- [ ] AC-1: 인터뷰 대화 후 새로고침해도 대화 이력이 유지된다
- [ ] AC-2: "감상문으로 저장" 클릭 시 records에 새 기록이 생성된다
- [ ] AC-3: 같은 책의 토론 주제 재요청 시 캐시에서 즉시 반환된다
- [ ] AC-4: /chat 페이지 대화도 DB에 저장된다
- [ ] AC-5: typecheck + lint + build 모두 통과
