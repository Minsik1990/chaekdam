-- 모임 횟수 카운팅 제외 기능
-- 특정 세션(송년회, 친목 모임 등)을 모임 횟수에서 제외할 수 있도록 함
ALTER TABLE club_sessions ADD COLUMN is_counted boolean NOT NULL DEFAULT true;
