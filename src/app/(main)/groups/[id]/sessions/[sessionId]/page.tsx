import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { SessionWithBook, Review } from "@/lib/supabase/types";
import { ReviewForm } from "@/components/features/review-form";
import { ChatPanel } from "@/components/features/chat-panel";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = (await supabase
    .from("sessions")
    .select("*, books(*)")
    .eq("id", sessionId)
    .single()) as { data: SessionWithBook | null };

  if (!session) notFound();

  const { data: reviews } = (await supabase
    .from("reviews")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })) as { data: Review[] | null };

  const book = session.books;
  const bookContext = book
    ? { title: book.title, author: book.author, description: book.description }
    : undefined;

  return (
    <div className="space-y-6">
      {/* 세션 헤더 */}
      <div className="flex items-start gap-4">
        {book?.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            width={80}
            height={112}
            className="h-28 w-20 rounded-lg object-cover shadow"
          />
        ) : (
          <div className="bg-muted flex h-28 w-20 items-center justify-center rounded-lg">
            <BookOpen className="text-muted-foreground h-8 w-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">{book?.title ?? "책 미정"}</h1>
          {book?.author && <p className="text-muted-foreground text-sm">{book.author}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={session.status === "upcoming" ? "outline" : "secondary"}>
              {session.status === "upcoming" ? "예정" : "완료"}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {new Date(session.session_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
            {session.presenter && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                발제: {session.presenter}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 발제문 */}
      {session.presentation_text && (
        <Card>
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-semibold">발제문</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {session.presentation_text}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 책 소개 */}
      {book?.description && (
        <Card>
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-semibold">책 소개</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{book.description}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* 후기 섹션 */}
      <section className="space-y-4">
        <h2 className="font-semibold">후기 ({reviews?.length ?? 0})</h2>

        <ReviewForm sessionId={sessionId} />

        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.nickname}</span>
                    <div className="flex items-center gap-1">
                      {review.rating && (
                        <span className="text-xs">{"⭐".repeat(review.rating)}</span>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {new Date(review.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm">아직 후기가 없어요</p>
            <p className="text-muted-foreground mt-1 text-xs">첫 번째 후기를 남겨보세요! ✨</p>
          </div>
        )}
      </section>

      {/* 밍들레 채팅 */}
      <ChatPanel bookContext={bookContext} />
    </div>
  );
}
