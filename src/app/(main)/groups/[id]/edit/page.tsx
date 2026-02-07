"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function GroupEditPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGroup() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // admin 권한 확인
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (member?.role !== "admin") {
        router.push(`/groups/${groupId}`);
        return;
      }

      const { data } = await supabase
        .from("reading_groups")
        .select("name, description")
        .eq("id", groupId)
        .single();

      if (data) {
        setName(data.name);
        setDescription(data.description ?? "");
      }
      setFetching(false);
    }
    fetchGroup();
  }, [groupId, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했어요");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <h1 className="text-[22px] font-bold">모임 편집</h1>
        <div className="text-muted-foreground py-8 text-center text-sm">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">모임 편집</h1>

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">모임 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
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
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
