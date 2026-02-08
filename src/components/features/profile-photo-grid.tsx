"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface PhotoInfo {
  url: string;
  sessionId: string;
  sessionOrder: number;
}

interface ProfilePhotoGridProps {
  photos: PhotoInfo[];
  clubId: string;
}

export function ProfilePhotoGrid({ photos, clubId }: ProfilePhotoGridProps) {
  const [showCount, setShowCount] = useState(12);
  const visiblePhotos = photos.slice(0, showCount);
  const hasMore = photos.length > showCount;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {visiblePhotos.map((photo) => (
          <Link
            key={photo.url}
            href={`/club/${clubId}/session/${photo.sessionId}`}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={photo.url}
              alt="모임 사진"
              fill
              sizes="(max-width: 480px) 33vw, 120px"
              className="object-cover"
            />
            <span className="absolute right-1 bottom-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
              #{photo.sessionOrder}
            </span>
          </Link>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowCount((prev) => prev + 12)}
          className="text-primary hover:bg-muted mt-3 w-full rounded-[14px] py-2 text-sm font-medium transition-colors"
        >
          더보기 ({photos.length - showCount}장 남음)
        </button>
      )}
    </>
  );
}
