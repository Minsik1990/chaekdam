-- 읽고 싶은 책 위시리스트
CREATE TABLE wishlist_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, book_id)
);

CREATE INDEX idx_wishlist_books_club ON wishlist_books(club_id);

ALTER TABLE wishlist_books DISABLE ROW LEVEL SECURITY;

-- 위시리스트 댓글
CREATE TABLE wishlist_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_book_id UUID NOT NULL REFERENCES wishlist_books(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (length(author) <= 20),
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wishlist_comments_book ON wishlist_comments(wishlist_book_id);
CREATE INDEX idx_wishlist_comments_created_at ON wishlist_comments(created_at);

ALTER TABLE wishlist_comments DISABLE ROW LEVEL SECURITY;
