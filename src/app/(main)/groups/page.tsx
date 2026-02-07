import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { ReadingGroup } from "@/lib/supabase/types";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: groups } = (await supabase
    .from("reading_groups")
    .select("*")
    .order("created_at", { ascending: false })) as { data: ReadingGroup[] | null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 독서 모임</h1>
        <Button asChild size="sm">
          <Link href="/groups/new">
            <Plus className="mr-1 h-4 w-4" />새 모임
          </Link>
        </Button>
      </div>

      {!groups || groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">📚</div>
            <p className="text-muted-foreground">참여 중인 독서 모임이 없어요</p>
            <p className="text-muted-foreground mt-1 text-sm">첫 모임을 만들어볼까요? 🌱</p>
            <Button asChild className="mt-4">
              <Link href="/groups/new">첫 모임 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="transition-all hover:scale-[1.01] hover:shadow-md">
                <CardContent className="py-4">
                  <h2 className="font-semibold">{group.name}</h2>
                  {group.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{group.description}</p>
                  )}
                  <p className="text-muted-foreground mt-2 text-xs">
                    만든 사람: {group.created_by}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
