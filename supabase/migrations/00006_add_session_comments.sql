-- 세션별 후기/댓글
CREATE TABLE session_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES club_sessions(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (length(author) <= 20),
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX idx_session_comments_created_at ON session_comments(created_at);

ALTER TABLE session_comments DISABLE ROW LEVEL SECURITY;
