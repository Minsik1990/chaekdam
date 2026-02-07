import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listConversations } from "@/lib/agent/conversations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const conversations = await listConversations(user.id, type, limit);
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "대화 목록을 불러올 수 없어요" }, { status: 500 });
  }
}
