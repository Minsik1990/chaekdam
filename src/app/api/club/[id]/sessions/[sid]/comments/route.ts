import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid: sessionId } = await params;
  const supabase = createClient();

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
  const { sid: sessionId } = await params;
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
