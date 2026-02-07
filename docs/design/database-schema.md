# 데이터베이스 스키마

> 최종 업데이트: 2026-02-07 (v1.0)
> Supabase MCP로 마이그레이션 생성 시 이 문서를 기반으로 합니다.

---

## 1. ER 다이어그램 (개요)

```
auth.users (Supabase 내장)
    │
    ├── 1:N → group_members → N:1 → reading_groups
    │
    ├── 1:N → sessions (presenter)
    │           │
    │           ├── 1:N → session_media
    │           ├── 1:N → reviews
    │           └── N:1 → books
    │
    ├── 1:N → reviews
    ├── 1:N → session_media (uploader)
    └── 1:N → agent_conversations
                    └── N:1 → books (optional)
                    └── N:1 → sessions (optional)

books ← 1:N → ai_contents
```

---

## 2. 테이블 상세

### 2.1 reading_groups (독서 모임)
```sql
CREATE TABLE reading_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_reading_groups_created_by ON reading_groups(created_by);
```

### 2.2 group_members (모임 멤버)
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

### 2.3 books (도서)
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
  api_source TEXT CHECK (api_source IN ('naver', 'aladin', 'kakao', 'manual')),
  raw_data JSONB,              -- API 원본 응답 저장
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('korean', title));
```

### 2.4 sessions (독서 세션/모임 회차)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  session_number INTEGER,        -- 모임 회차 번호
  session_date DATE NOT NULL,
  title TEXT,                    -- 세션 제목 (예: "제3회 - 데미안")
  presenter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  presentation_text TEXT,        -- 발제문
  notes TEXT,                    -- 모임 메모
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

### 2.5 session_media (세션 미디어)
```sql
CREATE TABLE session_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'link')),
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_session_media_session_id ON session_media(session_id);
```

### 2.6 reviews (후기/리뷰)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(session_id, user_id)  -- 세션당 1개 리뷰
);

-- 인덱스
CREATE INDEX idx_reviews_session_id ON reviews(session_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

### 2.7 ai_contents (AI 생성 콘텐츠 캐시)
```sql
CREATE TABLE ai_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('summary', 'discussion_questions', 'analysis', 'recommendation')),
  content JSONB NOT NULL,
  model_used TEXT,               -- 예: 'claude-haiku-4.5'
  prompt_hash TEXT,              -- 프롬프트 해시 (캐시 키)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_ai_contents_book_id ON ai_contents(book_id);
CREATE INDEX idx_ai_contents_prompt_hash ON ai_contents(prompt_hash);
```

### 2.8 agent_conversations (에이전트 대화 이력)
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',  -- [{role, content, timestamp}]
  conversation_type TEXT NOT NULL DEFAULT 'free_chat'
    CHECK (conversation_type IN ('free_chat', 'preparation', 'review', 'coaching')),
  title TEXT,                    -- 대화 제목 (자동 생성)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_book_id ON agent_conversations(book_id);
```

---

## 3. Row Level Security (RLS) 정책

### reading_groups
```sql
-- 멤버만 조회 가능
CREATE POLICY "Members can view groups" ON reading_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- 인증된 유저만 생성 가능
CREATE POLICY "Authenticated users can create groups" ON reading_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- admin만 수정 가능
CREATE POLICY "Admins can update groups" ON reading_groups
  FOR UPDATE USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### reviews
```sql
-- 모임 멤버만 조회
CREATE POLICY "Members can view reviews" ON reviews
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- 본인만 작성
CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 수정
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 4. 프로필 테이블 (Supabase Auth 확장)

```sql
-- auth.users의 프로필 확장 (Public 테이블)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 트리거: 새 유저 가입 시 자동 프로필 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 5. 향후 확장 (Phase 2~3)

| Phase | 테이블/변경 | 설명 |
|-------|-----------|------|
| Phase 2 | `session_media` 활성화 | Cloudflare R2 연동 |
| Phase 3 | `reading_goals` | 개인 독서 목표 |
| Phase 3 | `achievements` | 뱃지/게이미피케이션 |
| Phase 3 | `reading_stats` | 독서 통계 (물화 뷰) |
