import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const { id: clubId, wid } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("wishlist_books")
    .delete()
    .eq("id", wid)
    .eq("club_id", clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
