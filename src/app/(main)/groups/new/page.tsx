"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function getNicknameFromCookie(): string {
  const match = document.cookie.match(/mingdle_nickname=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "모임원";
}

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const nickname = getNicknameFromCookie();

      const { error: dbError } = await supabase.from("reading_groups").insert({
        name: name.trim(),
        description: description.trim(),
        created_by: nickname,
      });

      if (dbError) throw dbError;
      router.push("/groups");
      router.refresh();
    } catch {
      setError("모임 만들기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">새 독서 모임</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">모임 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">모임 이름</Label>
              <Input
                id="name"
                placeholder="예: 수요일의 독서"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
                placeholder="어떤 모임인지 간단히 소개해주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={200}
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
              <Button type="submit" className="flex-1" disabled={!name.trim() || loading}>
                {loading ? "만드는 중..." : "만들기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
