"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookSearch } from "@/components/features/book-search";
import { createClient } from "@/lib/supabase/client";

interface SelectedBook {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  coverUrl: string;
  description: string;
}

function getNicknameFromCookie(): string {
  const match = document.cookie.match(/mingdle_nickname=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "모임원";
}

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [sessionDate, setSessionDate] = useState("");
  const [presenter, setPresenter] = useState("");
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionDate) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let bookId: string | null = null;

      // 책이 선택된 경우, DB에 저장 (upsert by isbn)
      if (selectedBook) {
        const { data: existingBook } = (await supabase
          .from("books")
          .select("id")
          .eq("isbn", selectedBook.isbn)
          .single()) as { data: { id: string } | null };

        if (existingBook) {
          bookId = existingBook.id;
        } else {
          const { data: newBook } = (await supabase
            .from("books")
            .insert({
              isbn: selectedBook.isbn,
              title: selectedBook.title,
              author: selectedBook.author,
              publisher: selectedBook.publisher,
              cover_image_url: selectedBook.coverUrl,
              description: selectedBook.description,
            })
            .select("id")
            .single()) as { data: { id: string } | null };

          bookId = newBook?.id ?? null;
        }
      }

      const { error: dbError } = await supabase.from("sessions").insert({
        group_id: groupId,
        book_id: bookId,
        session_date: sessionDate,
        presenter: presenter.trim() || getNicknameFromCookie(),
        status: "upcoming",
      });

      if (dbError) throw dbError;
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch {
      setError("세션 만들기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">새 독서 세션</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">모임 날짜</Label>
              <Input
                id="date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>읽을 책</Label>
              {selectedBook ? (
                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                  {selectedBook.coverUrl && (
                    <Image
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      width={48}
                      height={64}
                      className="h-16 w-12 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selectedBook.title}</p>
                    <p className="text-muted-foreground text-xs">{selectedBook.author}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBook(null)}
                  >
                    변경
                  </Button>
                </div>
              ) : (
                <BookSearch onSelect={setSelectedBook} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="presenter">발제자</Label>
              <Input
                id="presenter"
                placeholder="발제자 이름 (비우면 내 닉네임)"
                value={presenter}
                onChange={(e) => setPresenter(e.target.value)}
                maxLength={20}
              />
            </div>

            {error && <p className="text-destructive text-center text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" className="flex-1" disabled={!sessionDate || loading}>
                {loading ? "만드는 중..." : "세션 추가"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
