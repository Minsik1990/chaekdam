"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function NewGroupPage() {
  const router = useRouter();
  const [tab, setTab] = useState("create");

  // 생성
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 참여
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const inviteCode = generateInviteCode();

      const { data: group, error: dbError } = await supabase
        .from("reading_groups")
        .insert({
          name: name.trim(),
          description: description.trim(),
          created_by: user.id,
          invite_code: inviteCode,
        })
        .select("id")
        .single();

      if (dbError) throw dbError;

      // 관리자로 멤버 추가
      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      });

      router.push(`/groups/${group.id}`);
      router.refresh();
    } catch {
      setError("모임 만들기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setJoinError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 모임 찾기
      const { data: group } = await supabase
        .from("reading_groups")
        .select("id")
        .eq("invite_code", joinCode.trim().toUpperCase())
        .single();

      if (!group) {
        setJoinError("초대 코드에 해당하는 모임을 찾을 수 없어요");
        return;
      }

      // 이미 가입했는지 확인
      const { data: existing } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        router.push(`/groups/${group.id}`);
        return;
      }

      // 멤버 추가
      const { error: joinDbError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

      if (joinDbError) throw joinDbError;

      router.push(`/groups/${group.id}`);
      router.refresh();
    } catch {
      setJoinError("모임 참여에 실패했어요. 다시 시도해주세요.");
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">독서 모임</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">새 모임 만들기</TabsTrigger>
          <TabsTrigger value="join">초대 코드로 참여</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardContent className="py-4">
              <form onSubmit={handleCreate} className="space-y-4">
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
                  <Label htmlFor="description">소개 (선택)</Label>
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
        </TabsContent>

        <TabsContent value="join">
          <Card>
            <CardContent className="py-4">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">초대 코드</Label>
                  <Input
                    id="joinCode"
                    placeholder="6자리 초대 코드"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="text-center text-lg uppercase"
                    maxLength={6}
                  />
                </div>
                {joinError && <p className="text-destructive text-center text-sm">{joinError}</p>}
                <Button type="submit" className="w-full" disabled={!joinCode.trim() || joinLoading}>
                  {joinLoading ? "참여 중..." : "모임 참여하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
