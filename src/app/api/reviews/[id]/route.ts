import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 감상 편집 (본인만)
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

    // 본인 감상인지 확인
    const { data: review } = await supabase
      .from("session_reviews")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json({ error: "감상을 찾을 수 없습니다" }, { status: 404 });
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "본인의 감상만 수정할 수 있습니다" }, { status: 403 });
    }

    const { content, rating } = (await request.json()) as {
      content?: string;
      rating?: number | null;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: "감상 내용은 필수입니다" }, { status: 400 });
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "별점은 1~5 사이여야 합니다" }, { status: 400 });
    }

    const { error } = await supabase
      .from("session_reviews")
      .update({
        content: content.trim(),
        rating: rating ?? null,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "감상 수정에 실패했습니다" }, { status: 500 });
  }
}

// 감상 삭제 (본인만)
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

    const { data: review } = await supabase
      .from("session_reviews")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json({ error: "감상을 찾을 수 없습니다" }, { status: 404 });
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "본인의 감상만 삭제할 수 있습니다" }, { status: 403 });
    }

    const { error } = await supabase.from("session_reviews").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "감상 삭제에 실패했습니다" }, { status: 500 });
  }
}
