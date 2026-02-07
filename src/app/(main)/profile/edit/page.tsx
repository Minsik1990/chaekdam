"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function ProfileEditPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const data = profileData as Profile | null;

      if (data) {
        setNickname(data.nickname ?? "");
        setBio(data.bio ?? "");
      }
      setFetching(false);
    }
    fetchProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), bio: bio.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <h1 className="text-[22px] font-bold">프로필 편집</h1>
        <div className="text-muted-foreground py-8 text-center text-sm">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">프로필 편집</h1>

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">자기소개 (선택)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="간단한 자기소개를 적어보세요"
              />
              <p className="text-muted-foreground text-right text-xs">{bio.length}/200</p>
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
              <Button type="submit" className="flex-1" disabled={!nickname.trim() || loading}>
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
