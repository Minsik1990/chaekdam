import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  const inviteCode = process.env.INVITE_CODE;

  if (!inviteCode) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  if (code !== inviteCode) {
    return NextResponse.json({ error: "잘못된 초대 코드" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  // 인증 쿠키 설정 (30일)
  response.cookies.set("mingdle_verified", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
