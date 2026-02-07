-- ============================================
-- Phase 2: AI 에이전트 V2 + 모임 기능 강화
-- 적용 방법: Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. agent_conversations 스키마 개선
-- title, result 컬럼 추가, nickname nullable로 변경
ALTER TABLE agent_conversations ALTER COLUMN nickname DROP NOT NULL;
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS result TEXT;

-- 2. profiles에 bio 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. RLS 정책 강화: reading_groups UPDATE는 admin만
DROP POLICY IF EXISTS "Enable update for authenticated users" ON reading_groups;
CREATE POLICY "reading_groups_update_admin" ON reading_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = reading_groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- 4. RLS 정책 추가: reading_groups DELETE는 admin만
DROP POLICY IF EXISTS "reading_groups_delete_admin" ON reading_groups;
CREATE POLICY "reading_groups_delete_admin" ON reading_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = reading_groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- 5. RLS 정책 강화: sessions INSERT는 멤버만
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
CREATE POLICY "sessions_insert_member" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = sessions.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- 6. RLS 정책 강화: sessions UPDATE는 admin 또는 발제자만
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sessions;
CREATE POLICY "sessions_update_restricted" ON sessions
  FOR UPDATE USING (
    presenter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = sessions.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- 7. RLS 정책 추가: sessions DELETE는 admin 또는 발제자만
DROP POLICY IF EXISTS "sessions_delete_restricted" ON sessions;
CREATE POLICY "sessions_delete_restricted" ON sessions
  FOR DELETE USING (
    presenter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = sessions.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- 8. group_members RLS 정책 강화
-- 탈퇴: 본인 또는 admin이 제거
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

-- 9. agent_conversations의 conversation_type CHECK 제약 업데이트
-- 기존 CHECK 제약이 있으면 삭제 후 재생성 (chat, interview 추가)
DO $$
BEGIN
  ALTER TABLE agent_conversations DROP CONSTRAINT IF EXISTS agent_conversations_conversation_type_check;
  ALTER TABLE agent_conversations ADD CONSTRAINT agent_conversations_conversation_type_check
    CHECK (conversation_type IN ('chat', 'interview', 'summarize', 'topics', 'draft', 'analysis'));
EXCEPTION WHEN OTHERS THEN
  -- 제약조건이 없으면 무시
  NULL;
END $$;
