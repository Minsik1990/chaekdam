import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/invite", "/api/invite/verify"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 정적 파일, _next 등은 통과
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 초대 코드 인증 쿠키 확인
  const verified = request.cookies.get("mingdle_verified")?.value;

  if (verified !== "true") {
    return NextResponse.redirect(new URL("/invite", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
