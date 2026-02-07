import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 모임 정보 수정 (admin만)
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

    // admin 권한 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "admin") {
      return NextResponse.json({ error: "모임 관리자만 수정할 수 있습니다" }, { status: 403 });
    }

    const { name, description } = (await request.json()) as {
      name?: string;
      description?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "모임 이름은 필수입니다" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reading_groups")
      .update({
        name: name.trim(),
        description: description?.trim() ?? "",
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "모임 수정에 실패했습니다" }, { status: 500 });
  }
}

// 모임 삭제 (admin만)
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

    // admin 권한 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "admin") {
      return NextResponse.json({ error: "모임 관리자만 삭제할 수 있습니다" }, { status: 403 });
    }

    const { error } = await supabase.from("reading_groups").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "모임 삭제에 실패했습니다" }, { status: 500 });
  }
}
