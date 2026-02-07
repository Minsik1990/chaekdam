import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 멤버 제거 (admin이 강퇴) 또는 탈퇴 (본인)
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: groupId, userId: targetUserId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const isSelf = user.id === targetUserId;

    if (!isSelf) {
      // 본인이 아닌 경우 admin 권한 필요
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (member?.role !== "admin") {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }

      // admin은 다른 admin을 제거할 수 없음
      const { data: target } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", targetUserId)
        .single();

      if (target?.role === "admin") {
        return NextResponse.json({ error: "관리자는 제거할 수 없습니다" }, { status: 400 });
      }
    } else {
      // 본인 탈퇴 시 admin인 경우 방지
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (member?.role === "admin") {
        return NextResponse.json(
          { error: "관리자는 탈퇴할 수 없습니다. 모임을 삭제하거나 관리자를 위임해주세요." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "멤버 관리에 실패했습니다" }, { status: 500 });
  }
}
