import Link from "next/link";
import Image from "next/image";
import { BookOpen, Plus, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getNickname } from "@/lib/cookies";
import type { SessionWithBook } from "@/lib/supabase/types";

export default async function HomePage() {
  const supabase = await createClient();
  const nickname = await getNickname();

  // 다가오는 세션 가져오기 (최신 5개)
  const { data: upcomingSessions } = (await supabase
    .from("sessions")
    .select("*, books(*)")
    .eq("status", "upcoming")
    .order("session_date", { ascending: true })
    .limit(5)) as { data: SessionWithBook[] | null };

  return (
    <div className="space-y-6">
      {/* 환영 섹션 */}
      <section className="text-center">
        <div className="mb-3 text-5xl">🌼</div>
        <h1 className="text-2xl font-bold">오늘도 한 페이지!</h1>
        <p className="text-muted-foreground mt-1">{nickname}님, 잘 버티고 잘 읽어내자</p>
      </section>

      {/* 빠른 액션 */}
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            모임 만들기
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/groups">
            <BookOpen className="mr-2 h-4 w-4" />내 모임
          </Link>
        </Button>
      </div>

      {/* 다가오는 모임 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            다가오는 모임
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!upcomingSessions || upcomingSessions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-3xl">📖</div>
              <p className="text-muted-foreground text-sm">아직 예정된 모임이 없어요</p>
              <p className="text-muted-foreground mt-1 text-xs">첫 독서 모임을 만들어볼까요?</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/groups/${session.group_id}/sessions/${session.id}`}
                  className="hover:bg-accent flex items-center gap-3 rounded-lg p-2 transition-colors"
                >
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      width={36}
                      height={48}
                      className="h-12 w-9 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-12 w-9 items-center justify-center rounded">
                      <BookOpen className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.books?.title ?? "책 미정"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(session.session_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                      {session.presenter && ` · 발제: ${session.presenter}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    예정
                  </Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
