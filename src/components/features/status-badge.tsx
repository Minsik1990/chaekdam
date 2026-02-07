import { Badge } from "@/components/ui/badge";
import type { RecordStatus } from "@/lib/supabase/types";

const STATUS_CONFIG = {
  reading: { label: "읽는 중", variant: "outline" as const },
  completed: { label: "완독", variant: "default" as const },
  wishlist: { label: "읽고 싶은", variant: "secondary" as const },
} satisfies Record<RecordStatus, { label: string; variant: "outline" | "default" | "secondary" }>;

export function StatusBadge({ status }: { status: RecordStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
