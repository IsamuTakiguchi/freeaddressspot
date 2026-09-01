import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { floorImageUrl } from "@/lib/floor-image";
import MapView from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/map");

  const [floorsRes, seatsRes, sessionsRes, profilesRes, meRes] =
    await Promise.all([
      supabase
        .from("floors")
        .select("id, name, image_path, image_width, image_height")
        .order("sort_order"),
      supabase
        .from("seats")
        .select("id, floor_id, label, x, y")
        .eq("is_active", true),
      supabase
        .from("seat_sessions")
        .select("id, seat_id, user_id, checked_in_at")
        .is("checked_out_at", null),
      supabase
        .from("profiles")
        .select("id, display_name, department, avatar_url, status"),
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    ]);

  const floors = (floorsRes.data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    image_url: floorImageUrl(f),
    image_width: f.image_width,
    image_height: f.image_height,
  }));

  return (
    <MapView
      floors={floors}
      seats={(seatsRes.data ?? []).map((s) => ({
        ...s,
        x: Number(s.x),
        y: Number(s.y),
      }))}
      initialSessions={sessionsRes.data ?? []}
      initialProfiles={profilesRes.data ?? []}
      myUserId={user.id}
      isAdmin={meRes.data?.is_admin ?? false}
    />
  );
}
