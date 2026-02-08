import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// wishlist_book이 해당 club에 속하는지 확인
async function verifyWishlistBook(
  supabase: ReturnType<typeof createClient>,
  wid: string,
  clubId: string
) {
  const { data } = await supabase
    .from("wishlist_books")
    .select("id")
    .eq("id", wid)
    .eq("club_id", clubId)
    .maybeSingle();
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const { id: clubId, wid } = await params;
  const supabase = createClient();

  // club_id 검증
  const wishlistBook = await verifyWishlistBook(supabase, wid, clubId);
  if (!wishlistBook) {
    return NextResponse.json({ error: "위시리스트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: comments, error } = await supabase
    .from("wishlist_comments")
    .select("id, author, content, created_at")
    .eq("wishlist_book_id", wid)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const { id: clubId, wid } = await params;

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

  // club_id 검증
  const wishlistBook = await verifyWishlistBook(supabase, wid, clubId);
  if (!wishlistBook) {
    return NextResponse.json({ error: "위시리스트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: comment, error } = await supabase
    .from("wishlist_comments")
    .insert({
      wishlist_book_id: wid,
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
