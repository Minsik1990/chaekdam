import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Plus, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { ReadingGroup, SessionWithBook } from "@/lib/supabase/types";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("reading_groups")
    .select("*")
    .eq("id", id)
    .single<ReadingGroup>();

  if (!group) notFound();

  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*, books(*)")
    .eq("group_id", id)
    .order("session_date", { ascending: false })) as { data: SessionWithBook[] | null };

  const upcomingSessions = sessions?.filter((s) => s.status === "upcoming") ?? [];
  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      {/* 모임 헤더 */}
      <div>
        <h1 className="text-xl font-bold">{group.name}</h1>
        {group.description && (
          <p className="text-muted-foreground mt-1 text-sm">{group.description}</p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">만든 사람: {group.created_by}</p>
      </div>

      {/* 새 세션 추가 */}
      <Button asChild className="w-full">
        <Link href={`/groups/${id}/sessions/new`}>
          <Plus className="mr-2 h-4 w-4" />새 독서 세션 추가
        </Link>
      </Button>

      {/* 다가오는 세션 */}
      {upcomingSessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Calendar className="h-4 w-4" />
            다가오는 모임
          </h2>
          {upcomingSessions.map((session) => (
            <Link key={session.id} href={`/groups/${id}/sessions/${session.id}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      width={48}
                      height={64}
                      className="h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 items-center justify-center rounded">
                      <BookOpen className="text-muted-foreground h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{session.books?.title ?? "책 미정"}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(session.session_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    {session.presenter && (
                      <p className="text-muted-foreground text-xs">발제: {session.presenter}</p>
                    )}
                  </div>
                  <Badge variant="outline">예정</Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {/* 완료된 세션 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4" />
          지난 모임
        </h2>
        {completedSessions.length === 0 && upcomingSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="mb-2 text-3xl">📖</div>
              <p className="text-muted-foreground text-sm">아직 모임 기록이 없어요</p>
              <p className="text-muted-foreground mt-1 text-xs">첫 독서 세션을 추가해볼까요?</p>
            </CardContent>
          </Card>
        ) : (
          completedSessions.map((session) => (
            <Link key={session.id} href={`/groups/${id}/sessions/${session.id}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      width={48}
                      height={64}
                      className="h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 items-center justify-center rounded">
                      <BookOpen className="text-muted-foreground h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{session.books?.title ?? "책 미정"}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(session.session_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    {session.presenter && (
                      <p className="text-muted-foreground text-xs">발제: {session.presenter}</p>
                    )}
                  </div>
                  <Badge variant="secondary">완료</Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
