"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  clubId: string;
  sessionId: string;
  initialPhotos: string[];
}

export function PhotoUploader({ clubId, sessionId, initialPhotos }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      setError("사진은 최대 10장까지 업로드 가능합니다.");
      return;
    }

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setError("파일 크기는 5MB 이하만 가능합니다.");
        return;
      }
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("photos", file);
      }

      const res = await fetch(`/api/club/${clubId}/sessions/${sessionId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setPhotos(data.photos);
      } else {
        setError(data.error || "업로드에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">사진</h3>
        {photos.length < 10 && (
          <label className="text-primary flex cursor-pointer items-center gap-1 text-xs font-medium">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {uploading ? "업로드 중..." : "사진 추가"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={url}
                alt={`사진 ${i + 1}`}
                fill
                sizes="(max-width: 480px) 33vw, 150px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">
          아직 사진이 없습니다. 모임 사진을 추가해보세요!
        </p>
      )}

      {error && <p className="text-destructive mt-2 text-center text-sm">{error}</p>}
    </div>
  );
}
