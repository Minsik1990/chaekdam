import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 세션 편집 (admin 또는 발제자)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 세션 조회 + 권한 확인
    const { data: session } = await supabase
      .from("sessions")
      .select("group_id, presenter_id")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    const isPresenter = session.presenter_id === user.id;

    if (!isPresenter) {
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", session.group_id)
        .eq("user_id", user.id)
        .single();

      if (member?.role !== "admin") {
        return NextResponse.json({ error: "수정 권한이 없습니다" }, { status: 403 });
      }
    }

    const { session_date, book_id } = (await request.json()) as {
      session_date?: string;
      book_id?: string | null;
    };

    const updateData: Record<string, unknown> = {};
    if (session_date) {
      if (isNaN(Date.parse(session_date))) {
        return NextResponse.json({ error: "올바른 날짜 형식이 아닙니다" }, { status: 400 });
      }
      updateData.session_date = session_date;
    }
    if (book_id !== undefined) updateData.book_id = book_id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
    }

    const { error } = await supabase.from("sessions").update(updateData).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "세션 수정에 실패했습니다" }, { status: 500 });
  }
}

// 세션 삭제 (admin 또는 발제자)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .select("group_id, presenter_id")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    const isPresenter = session.presenter_id === user.id;

    if (!isPresenter) {
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", session.group_id)
        .eq("user_id", user.id)
        .single();

      if (member?.role !== "admin") {
        return NextResponse.json({ error: "삭제 권한이 없습니다" }, { status: 403 });
      }
    }

    const { error } = await supabase.from("sessions").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "세션 삭제에 실패했습니다" }, { status: 500 });
  }
}
