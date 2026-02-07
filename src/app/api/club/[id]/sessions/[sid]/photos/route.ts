import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid: sessionId } = await params;
  const supabase = createClient();

  const formData = await request.formData();
  const files = formData.getAll("photos") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "사진을 선택해주세요." }, { status: 400 });
  }

  if (files.length > 10) {
    return NextResponse.json({ error: "최대 10장까지 업로드 가능합니다." }, { status: 400 });
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하만 가능합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("session-photos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("[photos] upload error:", uploadError.message);
      return NextResponse.json({ error: "사진 업로드에 실패했습니다." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("session-photos").getPublicUrl(path);

    uploadedUrls.push(urlData.publicUrl);
  }

  // 기존 사진 목록에 추가
  const { data: session } = await supabase
    .from("club_sessions")
    .select("photos")
    .eq("id", sessionId)
    .maybeSingle();

  const existingPhotos = (session?.photos as string[] | null) ?? [];
  const allPhotos = [...existingPhotos, ...uploadedUrls];

  const { error: updateError } = await supabase
    .from("club_sessions")
    .update({ photos: allPhotos, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ photos: allPhotos }, { status: 201 });
}
