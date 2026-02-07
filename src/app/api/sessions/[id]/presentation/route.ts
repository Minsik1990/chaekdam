import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 발제문 수정 (발제자만)
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

    const { data: session } = await supabase
      .from("sessions")
      .select("presenter_id")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    if (session.presenter_id !== user.id) {
      return NextResponse.json({ error: "발제자만 발제문을 수정할 수 있습니다" }, { status: 403 });
    }

    const { presentation_text } = (await request.json()) as { presentation_text: string };

    const { error } = await supabase
      .from("sessions")
      .update({ presentation_text: presentation_text ?? "" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "발제문 수정에 실패했습니다" }, { status: 500 });
  }
}
