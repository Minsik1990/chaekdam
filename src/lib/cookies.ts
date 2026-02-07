import { cookies } from "next/headers";

export async function getNickname(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("mingdle_nickname")?.value;
  return raw ? decodeURIComponent(raw) : "모임원";
}
