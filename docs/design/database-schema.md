# 데이터베이스 스키마

> 최종 업데이트: 2026-02-07 (v2.0)
> v2 전면 개편: 개인 기록 중심 스키마

---

## 1. ER 다이어그램 (개요)

```
auth.users (Supabase 내장)
    │
    ├── 1:1 → profiles
    ├── 1:N → records → N:1 → books
    ├── 1:N → collections
    │           └── N:M → records (via collection_records)
    ├── 1:N → group_members → N:1 → reading_groups
    ├── 1:N → session_reviews → N:1 → sessions
    ├── 1:N → agent_conversations
    └── 1:N → invite_codes (used_by)

reading_groups ── 1:N → sessions → N:1 → books
books ── 1:N → ai_contents
```

---

## 2. 테이블 상세

### 2.1 profiles (사용자 프로필)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 트리거: 새 유저 가입 시 자동 프로필 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', '독서인')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2.2 books (도서)

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  cover_image_url TEXT,
  description TEXT,
  published_date TEXT,
  api_source TEXT CHECK (api_source IN ('naver', 'manual')),
  raw_data JSONB,                -- API 원본 응답 저장
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('korean', title));
```

### 2.3 records (개인 독서 기록)

```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  content TEXT CHECK (char_length(content) <= 1000),       -- 감상, max 1000자
  quote TEXT CHECK (char_length(quote) <= 500),             -- 인용문, max 500자
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),       -- 별점 1~5, nullable
  status TEXT NOT NULL CHECK (status IN ('reading', 'completed', 'want_to_read')),
  card_color TEXT DEFAULT 'peach'
    CHECK (card_color IN ('peach', 'lavender', 'mint', 'lemon', 'rose', 'sky')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_book_id ON records(book_id);
CREATE INDEX idx_records_status ON records(status);
CREATE INDEX idx_records_created_at ON records(created_at DESC);
```

### 2.4 collections (기록 모음) -- Phase 2

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_collections_user_id ON collections(user_id);
```

### 2.5 collection_records (컬렉션-기록 매핑) -- Phase 2

```sql
CREATE TABLE collection_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(collection_id, record_id)
);

-- 인덱스
CREATE INDEX idx_collection_records_collection_id ON collection_records(collection_id);
CREATE INDEX idx_collection_records_record_id ON collection_records(record_id);
```

### 2.6 reading_groups (독서 모임)

```sql
CREATE TABLE reading_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  invite_code TEXT UNIQUE NOT NULL,     -- 모임 초대 코드 (6자리)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_reading_groups_created_by ON reading_groups(created_by);
CREATE INDEX idx_reading_groups_invite_code ON reading_groups(invite_code);
```

### 2.7 group_members (모임 멤버)

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(group_id, user_id)
);

-- 인덱스
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### 2.8 sessions (모임 세션/회차)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  session_number INTEGER,              -- 회차 번호
  session_date DATE NOT NULL,
  title TEXT,                          -- 세션 제목
  presenter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  presentation_text TEXT,              -- 발제문
  notes TEXT,                          -- 메모
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_sessions_book_id ON sessions(book_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);
```

### 2.9 session_reviews (세션 후기)

```sql
CREATE TABLE session_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(session_id, user_id)          -- 세션당 1인 1개 후기
);

-- 인덱스
CREATE INDEX idx_session_reviews_session_id ON session_reviews(session_id);
CREATE INDEX idx_session_reviews_user_id ON session_reviews(user_id);
```

### 2.10 agent_conversations (AI 대화 이력)

```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  conversation_type TEXT NOT NULL
    CHECK (conversation_type IN ('interview', 'summarize', 'topics', 'draft', 'analysis')),
  messages JSONB NOT NULL DEFAULT '[]',   -- [{role, content, timestamp}]
  result TEXT,                             -- 최종 생성 결과
  title TEXT,                              -- 대화 제목 (자동 생성)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_book_id ON agent_conversations(book_id);
CREATE INDEX idx_agent_conversations_type ON agent_conversations(conversation_type);
```

### 2.11 ai_contents (AI 생성 콘텐츠 캐시)

```sql
CREATE TABLE ai_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('summary', 'topics', 'analysis', 'draft', 'recommendation')),
  content JSONB NOT NULL,
  model_used TEXT,                         -- 예: 'claude-sonnet-4-5'
  prompt_hash TEXT,                        -- 프롬프트 해시 (캐시 키)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_ai_contents_book_id ON ai_contents(book_id);
CREATE INDEX idx_ai_contents_prompt_hash ON ai_contents(prompt_hash);
CREATE INDEX idx_ai_contents_type ON ai_contents(content_type);
```

### 2.12 invite_codes (서비스 초대 코드)

```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_is_active ON invite_codes(is_active);
```

---

## 3. Row Level Security (RLS) 정책

### profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 프로필 조회 가능
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- 본인만 수정 가능
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### records

```sql
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 본인 기록 조회 + 공개 기록 조회
CREATE POLICY "Users can view own or public records" ON records
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

-- 본인만 작성
CREATE POLICY "Users can create own records" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 수정
CREATE POLICY "Users can update own records" ON records
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 삭제
CREATE POLICY "Users can delete own records" ON records
  FOR DELETE USING (auth.uid() = user_id);
```

### reading_groups

```sql
ALTER TABLE reading_groups ENABLE ROW LEVEL SECURITY;

-- 멤버만 조회
CREATE POLICY "Members can view groups" ON reading_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- 인증된 유저만 생성
CREATE POLICY "Authenticated users can create groups" ON reading_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- admin만 수정
CREATE POLICY "Admins can update groups" ON reading_groups
  FOR UPDATE USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### session_reviews

```sql
ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;

-- 모임 멤버만 조회
CREATE POLICY "Members can view reviews" ON session_reviews
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- 본인만 작성
CREATE POLICY "Users can create own reviews" ON session_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 수정
CREATE POLICY "Users can update own reviews" ON session_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 삭제
CREATE POLICY "Users can delete own reviews" ON session_reviews
  FOR DELETE USING (auth.uid() = user_id);
```

### agent_conversations

```sql
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- 본인 대화만 조회
CREATE POLICY "Users can view own conversations" ON agent_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- 본인만 생성
CREATE POLICY "Users can create own conversations" ON agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 수정
CREATE POLICY "Users can update own conversations" ON agent_conversations
  FOR UPDATE USING (auth.uid() = user_id);
```

### invite_codes

```sql
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 코드 검증은 Service Role로만 (anon으로 직접 접근 불가)
-- API Route에서 service_role 클라이언트로 검증
```

### books, ai_contents

```sql
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contents ENABLE ROW LEVEL SECURITY;

-- books: 인증 사용자 누구나 조회/생성 가능
CREATE POLICY "Authenticated users can view books" ON books
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert books" ON books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ai_contents: 인증 사용자 조회 가능 (생성은 Service Role)
CREATE POLICY "Authenticated users can view ai_contents" ON ai_contents
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 4. 주요 제약사항 요약

| 테이블            | 제약           | 설명                                         |
| ----------------- | -------------- | -------------------------------------------- |
| records.content   | max 1,000자    | `CHECK (char_length(content) <= 1000)`       |
| records.quote     | max 500자      | `CHECK (char_length(quote) <= 500)`          |
| records.rating    | 1~5, nullable  | `CHECK (rating >= 1 AND rating <= 5)`        |
| records.status    | NOT NULL       | `'reading'`, `'completed'`, `'want_to_read'` |
| session_reviews   | 1인 1후기      | `UNIQUE(session_id, user_id)`                |
| group_members     | 중복 가입 방지 | `UNIQUE(group_id, user_id)`                  |
| books.isbn        | 중복 방지      | `UNIQUE`                                     |
| invite_codes.code | 중복 방지      | `UNIQUE`                                     |

---

## 5. 향후 확장 (Phase 2~3)

| Phase   | 테이블/변경                            | 설명             |
| ------- | -------------------------------------- | ---------------- |
| Phase 2 | collections, collection_records 활성화 | 기록 모음 기능   |
| Phase 2 | records에 image_url 컬럼 추가          | 기록 이미지 첨부 |
| Phase 3 | follows (팔로우 관계)                  | 소셜 기능        |
| Phase 3 | reading_goals (독서 목표)              | 개인 목표 관리   |
| Phase 3 | notifications (알림)                   | 이메일/푸시 알림 |
