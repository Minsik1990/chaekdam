import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/features/star-rating";
import { StatusBadge } from "@/components/features/status-badge";
import { createClient } from "@/lib/supabase/server";
import type { RecordWithBook } from "@/lib/supabase/types";
import { RecordActions } from "./record-actions";

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: record } = (await supabase
    .from("records")
    .select("*, books(*)")
    .eq("id", id)
    .single()) as { data: RecordWithBook | null };

  if (!record) notFound();

  const book = record.books;
  const isOwner = user?.id === record.user_id;

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft className="mr-1 h-4 w-4" />
          뒤로
        </Link>
      </Button>

      {/* 책 정보 */}
      <div className="flex items-start gap-4">
        {book?.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            width={80}
            height={112}
            className="h-28 w-20 rounded-xl object-cover shadow"
          />
        ) : (
          <div className="bg-muted flex h-28 w-20 items-center justify-center rounded-xl">
            <BookOpen className="text-muted-foreground h-8 w-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">{book?.title ?? "책 정보 없음"}</h1>
          {book?.author && <p className="text-muted-foreground text-sm">{book.author}</p>}
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={record.status} />
            {record.rating && <StarRating value={record.rating} readonly size="sm" />}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {new Date(record.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* 감상 */}
      {record.content && (
        <Card>
          <CardContent className="py-4">
            <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">감상</h2>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{record.content}</p>
          </CardContent>
        </Card>
      )}

      {/* 인용구 */}
      {record.quote && (
        <Card className="bg-secondary">
          <CardContent className="py-4">
            <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">인상 깊은 문구</h2>
            <p className="text-[15px] leading-relaxed italic">&ldquo;{record.quote}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      {isOwner && <RecordActions recordId={record.id} />}
    </div>
  );
}
