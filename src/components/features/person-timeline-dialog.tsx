"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface SessionInfo {
  id: string;
  session_date: string;
  book?: {
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
}

interface PersonTimelineDialogProps {
  name: string;
  role: "participant" | "presenter";
  sessions: SessionInfo[];
  clubId: string;
  trigger: React.ReactNode;
}

export function PersonTimelineDialog({
  name,
  role,
  sessions,
  clubId,
  trigger,
}: PersonTimelineDialogProps) {
  const roleLabel = role === "presenter" ? "발제" : "참여";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto rounded-[20px] sm:max-w-md">
        <DialogTitle className="text-base font-bold">
          {name}님의 {roleLabel} 기록 ({sessions.length}회)
        </DialogTitle>

        {sessions.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">기록이 없습니다.</p>
        ) : (
          <div className="relative mt-2 space-y-0">
            {/* 타임라인 세로선 */}
            <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-indigo-100" />

            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/club/${clubId}/session/${s.id}`}
                className="group relative flex items-start gap-3 rounded-[14px] p-2 transition-colors hover:bg-indigo-50/50"
              >
                {/* 타임라인 점 */}
                <div className="bg-primary z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" />

                {/* 책 표지 */}
                <div className="bg-muted h-14 w-10 shrink-0 overflow-hidden rounded-md">
                  {s.book?.cover_image_url ? (
                    <Image
                      src={s.book.cover_image_url}
                      alt={s.book.title}
                      width={40}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* 세션 정보 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-indigo-600">
                    {s.book?.title ?? "책 미정"}
                  </p>
                  {s.book?.author && (
                    <p className="text-muted-foreground truncate text-xs">{s.book.author}</p>
                  )}
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDate(s.session_date)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}
