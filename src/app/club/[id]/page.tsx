import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface SessionWithBook {
  id: string;
  session_number: number | null;
  session_date: string;
  is_counted: boolean;
  presenter: string[] | null;
  books: {
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
}

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data: sessions } = await supabase
    .from("club_sessions")
    .select(
      "id, session_number, session_date, is_counted, presenter, books(title, author, cover_image_url)"
    )
    .eq("club_id", clubId)
    .not("book_id", "is", null)
    .order("session_date", { ascending: false });

  const typedSessions = (sessions ?? []) as unknown as SessionWithBook[];

  // 날짜 기반 모임 회차 계산 (is_counted=false 세션 제외)
  const countedSessions = typedSessions.filter((s) => s.is_counted !== false);
  const uniqueDates = [...new Set(countedSessions.map((s) => s.session_date))].sort();
  const dateToMeetingNum = new Map<string, number>();
  uniqueDates.forEach((date, i) => dateToMeetingNum.set(date, i + 1));

  if (typedSessions.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="아직 읽은 책이 없어요"
        description="모임에서 읽은 책을 기록해보세요"
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {typedSessions.map((session) => (
        <Link key={session.id} href={`/club/${clubId}/session/${session.id}`} className="group">
          <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-[14px]">
            {session.books?.cover_image_url ? (
              <Image
                src={session.books.cover_image_url}
                alt={session.books.title}
                fill
                sizes="(max-width: 480px) 33vw, 150px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-center">
                <span className="text-muted-foreground text-xs">
                  {session.books?.title ?? `#${dateToMeetingNum.get(session.session_date) ?? 0}`}
                </span>
              </div>
            )}
          </div>
          <div className="mt-1.5 px-0.5">
            <p className="truncate text-xs font-medium">
              {session.books?.title ?? `제${dateToMeetingNum.get(session.session_date) ?? 0}회`}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {(session.presenter ?? []).join(", ")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
