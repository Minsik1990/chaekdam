import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// session이 해당 club에 속하는지 확인
async function verifySession(
  supabase: ReturnType<typeof createClient>,
  sid: string,
  clubId: string
) {
  const { data } = await supabase
    .from("club_sessions")
    .select("id")
    .eq("id", sid)
    .eq("club_id", clubId)
    .maybeSingle();
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;
  const supabase = createClient();

  const session = await verifySession(supabase, sessionId, clubId);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: comments, error } = await supabase
    .from("session_comments")
    .select("id, author, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const { author, content } = body;

  if (!author?.trim()) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  if (content.trim().length > 1000) {
    return NextResponse.json({ error: "1000자 이내로 작성해주세요." }, { status: 400 });
  }

  const supabase = createClient();

  const session = await verifySession(supabase, sessionId, clubId);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: comment, error } = await supabase
    .from("session_comments")
    .insert({
      session_id: sessionId,
      author: author.trim(),
      content: content.trim(),
    })
    .select("id, author, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { commentId } = await request.json();
  if (!commentId) {
    return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();

  const session = await verifySession(supabase, sessionId, clubId);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await supabase
    .from("session_comments")
    .delete()
    .eq("id", commentId)
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
