import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "초대 코드가 필요합니다" }, { status: 400 });
  }

  // Supabase에서 초대 코드 확인
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API route에서는 쿠키 설정 불필요
        },
      },
    }
  );

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code, used_by, expires_at")
    .eq("code", code)
    .single();

  if (!inviteCode) {
    return NextResponse.json({ error: "잘못된 초대 코드" }, { status: 401 });
  }

  // 만료 확인
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 초대 코드" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
