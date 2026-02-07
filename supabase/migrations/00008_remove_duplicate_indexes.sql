-- 중복 인덱스 제거: UNIQUE 제약조건이 이미 인덱스를 생성하므로 별도 인덱스 불필요
DROP INDEX IF EXISTS idx_books_isbn;        -- books_isbn_key (UNIQUE)와 중복
DROP INDEX IF EXISTS idx_clubs_access_code;  -- clubs_access_code_key (UNIQUE)와 중복
