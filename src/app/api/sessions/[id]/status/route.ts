import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 세션 상태 변경 (admin만)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("group_id")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    // admin 권한 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", session.group_id)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "admin") {
      return NextResponse.json({ error: "관리자만 상태를 변경할 수 있습니다" }, { status: 403 });
    }

    const { status } = (await request.json()) as { status: string };

    // cancelled는 Phase 3에서 지원 예정
    if (!["upcoming", "completed"].includes(status)) {
      return NextResponse.json({ error: "올바르지 않은 상태입니다" }, { status: 400 });
    }

    const { error } = await supabase.from("sessions").update({ status }).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "상태 변경에 실패했습니다" }, { status: 500 });
  }
}
