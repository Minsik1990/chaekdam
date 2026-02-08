import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 쿠키 인증 헬퍼
function verifyAccess(request: NextRequest, clubId: string) {
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;

  const authError = verifyAccess(request, clubId);
  if (authError) return authError;

  const supabase = createClient();

  const formData = await request.formData();
  const files = formData.getAll("photos") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "사진을 선택해주세요." }, { status: 400 });
  }

  if (files.length > 10) {
    return NextResponse.json({ error: "최대 10장까지 업로드 가능합니다." }, { status: 400 });
  }

  // 업로드 전 파일 크기 전체 검증
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하만 가능합니다." }, { status: 400 });
    }
  }

  const uploadedUrls: string[] = [];
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("session-photos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("[photos] upload error:", uploadError.message);
      // 이미 업로드된 파일 정리
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("session-photos").remove(uploadedPaths);
      }
      return NextResponse.json({ error: "사진 업로드에 실패했습니다." }, { status: 500 });
    }

    uploadedPaths.push(path);
    const { data: urlData } = supabase.storage.from("session-photos").getPublicUrl(path);
    uploadedUrls.push(urlData.publicUrl);
  }

  // 기존 사진 목록에 추가
  const { data: session } = await supabase
    .from("club_sessions")
    .select("photos")
    .eq("id", sessionId)
    .eq("club_id", clubId)
    .maybeSingle();

  const existingPhotos = (session?.photos as string[] | null) ?? [];
  const allPhotos = [...existingPhotos, ...uploadedUrls];

  const { error: updateError } = await supabase
    .from("club_sessions")
    .update({ photos: allPhotos, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("club_id", clubId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ photos: allPhotos }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;

  const authError = verifyAccess(request, clubId);
  if (authError) return authError;

  const body = await request.json();
  const { photoUrl } = body;

  if (!photoUrl) {
    return NextResponse.json({ error: "삭제할 사진 URL이 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();

  // 기존 사진 목록에서 제거
  const { data: session } = await supabase
    .from("club_sessions")
    .select("photos")
    .eq("id", sessionId)
    .eq("club_id", clubId)
    .maybeSingle();

  const existingPhotos = (session?.photos as string[] | null) ?? [];
  const updatedPhotos = existingPhotos.filter((url: string) => url !== photoUrl);

  const { error: updateError } = await supabase
    .from("club_sessions")
    .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("club_id", clubId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Storage에서도 파일 삭제 (URL에서 경로 추출)
  try {
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/session-photos\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from("session-photos").remove([pathMatch[1]]);
    }
  } catch {
    // Storage 삭제 실패는 무시 (DB에서는 이미 제거됨)
  }

  return NextResponse.json({ photos: updatedPhotos });
}

// 사진 순서 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid: sessionId } = await params;

  const authError = verifyAccess(request, clubId);
  if (authError) return authError;

  const body = await request.json();
  const { photos } = body;

  if (!Array.isArray(photos) || !photos.every((p: unknown) => typeof p === "string")) {
    return NextResponse.json({ error: "photos는 문자열 배열이어야 합니다." }, { status: 400 });
  }

  const supabase = createClient();

  // 기존 사진 목록과 집합 일치 검증 (순서만 변경 허용)
  const { data: session } = await supabase
    .from("club_sessions")
    .select("photos")
    .eq("id", sessionId)
    .eq("club_id", clubId)
    .maybeSingle();

  const existingPhotos = (session?.photos as string[] | null) ?? [];
  const existingSet = new Set(existingPhotos);
  const incomingSet = new Set(photos as string[]);

  if (
    existingSet.size !== incomingSet.size ||
    ![...existingSet].every((url) => incomingSet.has(url))
  ) {
    return NextResponse.json(
      { error: "사진 목록이 일치하지 않습니다. 순서만 변경할 수 있습니다." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("club_sessions")
    .update({ photos, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("club_id", clubId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ photos });
}
