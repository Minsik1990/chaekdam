# 모임 기능 강화 스펙

> 작성일: 2026-02-07
> 상태: Draft

## 1. 배경 & 목적

현재 모임 기능(6.5/10)은 기본 구조만 갖추고 있어 실제 운영에 필수적인 관리 기능이 부족하다:

- **CRUD 미완성**: 모임/세션 생성만 가능, 편집/삭제 불가
- **멤버 관리 부재**: 멤버 목록이 상세 페이지에 표시되지 않음, 탈퇴 불가
- **초대 공유 미비**: 초대 코드가 뱃지로만 표시, 복사/공유 기능 없음
- **세션 관리 부족**: 발제문 작성 UI 없음, 상태 변경 불가
- **프로필 편집 불가**: 닉네임/소개 변경 기능 없음
- **RLS 정책 갭**: admin 권한 보호 미흡 (모든 인증 사용자가 모임 수정 가능)

이 개선으로 모임을 실제 운영 가능한 수준으로 끌어올린다.

## 2. 요구사항

### 기능 요구사항

**Phase 2A: 핵심 CRUD (필수)**

- [x] FR-1: 모임 정보 편집 (이름, 설명) — admin만
- [x] FR-2: 모임 삭제 — admin만 (확인 다이얼로그)
- [x] FR-3: 멤버 목록 표시 — 모임 상세에 멤버 카드/리스트
- [x] FR-4: 초대 코드 복사/공유 — 클립보드 복사 + 공유 URL
- [x] FR-5: 세션 편집 (날짜, 책 변경) — admin/발제자
- [x] FR-6: 세션 삭제 — admin/발제자
- [x] FR-7: 세션 상태 변경 (upcoming → completed) — admin
- [x] FR-8: 발제문 작성/편집 UI — 발제자
- [x] FR-9: 감상 편집/삭제 — 본인
- [x] FR-10: RLS 정책 강화 (4개 정책 추가/수정)

**Phase 2B: 프로필 + 연동 (중요)**

- [ ] FR-11: 프로필 편집 (닉네임, 자기소개)
- [ ] FR-12: 모임 탈퇴 (일반 멤버)
- [ ] FR-13: 멤버 제거 (admin이 강퇴)

**Phase 2C: 고도화 (나중)**

- [ ] FR-14: 개인 기록 ↔ 모임 세션 자동 연동
- [ ] FR-15: 모임별 독서 통계

### 비기능 요구사항

- 보안: RLS로 admin/member 권한 분리
- 성능: 멤버 목록 쿼리 < 200ms (인덱스 활용)
- UX: 파괴적 작업에 확인 다이얼로그 필수

## 3. 기술 설계

### 3.1 DB 마이그레이션 (00004_group_enhancement.sql)

```sql
-- 1. RLS 정책 강화: reading_groups UPDATE는 admin만
DROP POLICY IF EXISTS "reading_groups_update" ON reading_groups;
CREATE POLICY "reading_groups_update_admin" ON reading_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. RLS 정책 추가: reading_groups DELETE는 admin만
CREATE POLICY "reading_groups_delete_admin" ON reading_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. RLS 정책 강화: sessions INSERT는 멤버만
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert_member" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = sessions.group_id AND user_id = auth.uid()
    )
  );

-- 4. RLS 정책 추가: sessions DELETE는 admin 또는 발제자만
CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (
    presenter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = sessions.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. RLS 정책 강화: sessions UPDATE는 admin 또는 발제자만
DROP POLICY IF EXISTS "sessions_update" ON sessions;
CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (
    presenter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = sessions.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 6. profiles에 bio 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 200);
```

### 3.2 API 엔드포인트

| 메서드 | 경로                                | 설명           | 권한            |
| ------ | ----------------------------------- | -------------- | --------------- |
| PUT    | `/api/groups/[id]`                  | 모임 정보 수정 | admin           |
| DELETE | `/api/groups/[id]`                  | 모임 삭제      | admin           |
| DELETE | `/api/groups/[id]/members/[userId]` | 멤버 제거/탈퇴 | admin 또는 본인 |
| PUT    | `/api/sessions/[id]`                | 세션 편집      | admin/발제자    |
| DELETE | `/api/sessions/[id]`                | 세션 삭제      | admin/발제자    |
| PATCH  | `/api/sessions/[id]/status`         | 상태 변경      | admin           |
| PUT    | `/api/sessions/[id]/presentation`   | 발제문 수정    | 발제자          |
| PUT    | `/api/reviews/[id]`                 | 감상 편집      | 본인            |
| DELETE | `/api/reviews/[id]`                 | 감상 삭제      | 본인            |
| PUT    | `/api/profile`                      | 프로필 편집    | 본인            |

### 3.3 컴포넌트 변경

**수정 파일:**

| 파일                                        | 변경 내용                                                    |
| ------------------------------------------- | ------------------------------------------------------------ |
| `groups/[id]/page.tsx`                      | 멤버 목록 섹션, 초대 코드 복사 버튼, 편집/삭제 드롭다운 메뉴 |
| `groups/[id]/sessions/[sessionId]/page.tsx` | 발제문 편집 UI, 세션 편집/삭제/상태 변경 버튼                |
| `session-review-form.tsx`                   | 기존 감상 편집 모드 추가                                     |
| `profile/page.tsx`                          | 프로필 편집 링크 추가                                        |

**신규 파일:**

| 파일                                             | 설명                                       |
| ------------------------------------------------ | ------------------------------------------ |
| `groups/[id]/edit/page.tsx`                      | 모임 편집 페이지                           |
| `groups/[id]/members/page.tsx`                   | 멤버 관리 페이지 (전체 목록 + 역할 + 제거) |
| `groups/[id]/sessions/[sessionId]/edit/page.tsx` | 세션 편집 페이지                           |
| `profile/edit/page.tsx`                          | 프로필 편집 페이지                         |
| `components/features/invite-share.tsx`           | 초대 코드 복사/공유 컴포넌트               |
| `api/groups/[id]/route.ts`                       | 모임 수정/삭제 API                         |
| `api/groups/[id]/members/[userId]/route.ts`      | 멤버 관리 API                              |
| `api/sessions/[id]/route.ts`                     | 세션 편집/삭제 API                         |
| `api/sessions/[id]/status/route.ts`              | 세션 상태 변경 API                         |
| `api/sessions/[id]/presentation/route.ts`        | 발제문 수정 API                            |
| `api/reviews/[id]/route.ts`                      | 감상 편집/삭제 API                         |
| `api/profile/route.ts`                           | 프로필 편집 API                            |

## 4. UI 설계

### 4.1 모임 상세 — 멤버 + 초대 공유

```
┌─────────────────────────────────────┐
│ 독독 독서 모임           [⚙ 설정 ▼]│
│ 매주 토요일 함께 읽어요   편집/삭제 │
├─────────────────────────────────────┤
│ 멤버 (4명)            [초대하기 📋] │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐               │
│ │민식│ │유진│ │서연│ │+1│  [전체보기]│
│ └──┘ └──┘ └──┘ └──┘               │
├─────────────────────────────────────┤
│ 다가오는 세션                       │
│ ┌───────────────────────────┐      │
│ │ 📖 데미안 | 2/15 | upcoming│      │
│ │ 발제자: 민식               │      │
│ └───────────────────────────┘      │
└─────────────────────────────────────┘
```

### 4.2 초대 공유 다이얼로그

```
┌──────────────────────────────┐
│ 초대 코드                     │
│ ┌──────────────────────────┐ │
│ │  ABC123          [복사]  │ │
│ └──────────────────────────┘ │
│                              │
│ 또는 링크로 공유:            │
│ ┌──────────────────────────┐ │
│ │ dokdok-app.vercel.app/   │ │
│ │ groups/join?code=ABC123  │ │
│ │                  [복사]  │ │
│ └──────────────────────────┘ │
│                              │
│ [카카오톡 공유] [링크 공유]  │
└──────────────────────────────┘
```

### 4.3 세션 상세 — 발제문 + 편집

```
┌─────────────────────────────────────┐
│ 📖 데미안                           │
│ 2026-02-15 | 발제자: 민식           │
│ 상태: upcoming  [✅ 완료로 변경]    │
├─────────────────────────────────────┤
│ 발제문                    [편집 ✏️] │
│ 데미안은 헤르만 헤세의...           │
│                                     │
├─────────────────────────────────────┤
│ AI 도구                             │
│ [토론 주제] [발제문 초안] [분석]    │
├─────────────────────────────────────┤
│ 감상 (3)                            │
│ ┌───────────────────────────────┐  │
│ │ 유진 ⭐⭐⭐⭐ [편집] [삭제]  │  │
│ │ 자아를 찾아가는 과정이...     │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 5. 구현 계획

### Step 1: DB 마이그레이션 + RLS 강화

- 마이그레이션 파일 작성 (00004_group_enhancement.sql)
- Supabase에 적용
- 타입 재생성 (`supabase gen types`)

### Step 2: API Routes 생성 (6개)

- `/api/groups/[id]` — PUT, DELETE
- `/api/sessions/[id]` — PUT, DELETE
- `/api/sessions/[id]/status` — PATCH
- `/api/sessions/[id]/presentation` — PUT
- `/api/reviews/[id]` — PUT, DELETE
- `/api/profile` — PUT

### Step 3: 모임 상세 페이지 개선

- 멤버 목록 섹션 추가
- 초대 코드 공유 컴포넌트 (`invite-share.tsx`)
- 모임 설정 드롭다운 (편집/삭제)

### Step 4: 모임 편집/삭제

- `groups/[id]/edit/page.tsx` 신규
- 삭제 확인 다이얼로그

### Step 5: 세션 CRUD 완성

- 세션 편집 페이지 (`sessions/[sessionId]/edit/page.tsx`)
- 발제문 작성/편집 UI
- 세션 상태 변경 버튼
- 세션 삭제 (확인 다이얼로그)

### Step 6: 감상 편집/삭제

- `session-review-form.tsx` 편집 모드 추가
- 삭제 버튼 + 확인

### Step 7: 프로필 편집

- `profile/edit/page.tsx` 신규
- 닉네임, 자기소개(bio) 입력
- `/api/profile` API

### Step 8: 멤버 관리

- `groups/[id]/members/page.tsx` 신규
- 멤버 제거 (admin), 탈퇴 (본인)

### Step 9: 검증

- typecheck + lint + build
- 각 API 수동 테스트 (권한 확인)

## 6. 인수 기준

- [ ] AC-1: admin이 모임 이름/설명을 편집할 수 있다 (일반 멤버는 불가)
- [ ] AC-2: admin이 모임을 삭제할 수 있다 (확인 다이얼로그 포함)
- [ ] AC-3: 모임 상세에 멤버 목록이 표시된다
- [ ] AC-4: 초대 코드 복사 버튼 클릭 시 클립보드에 복사된다
- [ ] AC-5: 발제자가 발제문을 작성/편집할 수 있다
- [ ] AC-6: admin이 세션 상태를 upcoming→completed로 변경할 수 있다
- [ ] AC-7: 본인의 감상을 편집/삭제할 수 있다
- [ ] AC-8: 프로필에서 닉네임을 변경할 수 있다
- [ ] AC-9: RLS 정책이 올바르게 작동한다 (비권한자 차단)
- [ ] AC-10: typecheck + lint + build 모두 통과
