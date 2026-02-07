import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 프로필 편집 (본인)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { nickname, bio } = (await request.json()) as {
      nickname?: string;
      bio?: string;
    };

    if (!nickname?.trim()) {
      return NextResponse.json({ error: "닉네임은 필수입니다" }, { status: 400 });
    }

    if (nickname.trim().length > 20) {
      return NextResponse.json({ error: "닉네임은 20자 이내로 입력해주세요" }, { status: 400 });
    }

    if (bio && bio.length > 200) {
      return NextResponse.json({ error: "자기소개는 200자 이내로 입력해주세요" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { nickname: nickname.trim() };
    // bio 컬럼이 있으면 업데이트 (마이그레이션 적용 후)
    if (bio !== undefined) updateData.bio = bio.trim();

    const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "프로필 수정에 실패했습니다" }, { status: 500 });
  }
}
