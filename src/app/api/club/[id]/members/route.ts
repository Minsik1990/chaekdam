import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("members")
    .select("name")
    .eq("club_id", clubId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const names = (data ?? []).map((m) => m.name);
  return NextResponse.json({ members: names });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const body = await request.json();
  const name = (body.name as string)?.trim();

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  const supabase = createClient();

  // 중복 체크
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("club_id", clubId)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 등록된 멤버입니다." }, { status: 409 });
  }

  const { error } = await supabase.from("members").insert({ club_id: clubId, name });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;
  const body = await request.json();
  const name = (body.name as string)?.trim();

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  const supabase = createClient();

  const { error } = await supabase.from("members").delete().eq("club_id", clubId).eq("name", name);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
