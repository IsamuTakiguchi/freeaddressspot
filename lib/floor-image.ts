import type { Floor } from "@/lib/database.types";

// floors.image_path を表示用URLへ解決する。
// '/' or 'http' 始まりはそのまま（seedのサンプル図面等）、
// それ以外は Storage 'floors' バケットの公開URLとして扱う。
export function floorImageUrl(floor: Pick<Floor, "image_path">): string {
  const p = floor.image_path;
  if (p.startsWith("/") || p.startsWith("http")) return p;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/floors/${p}`;
}
