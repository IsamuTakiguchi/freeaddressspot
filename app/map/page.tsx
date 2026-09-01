import { requireUser, isAdmin } from "@/lib/auth-helpers";
import { floorImageUrl } from "@/lib/floor-image";
import {
  listActiveSessions,
  listFloors,
  listProfilesLite,
  listSeats,
} from "@/lib/queries";
import MapView from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const user = await requireUser("/map");

  const [floors, seats, sessions, profiles, admin] = await Promise.all([
    listFloors(),
    listSeats({ activeOnly: true }),
    listActiveSessions(),
    listProfilesLite(),
    isAdmin(user.id),
  ]);

  return (
    <MapView
      floors={floors.map((f) => ({
        id: f.id,
        name: f.name,
        image_url: floorImageUrl(f),
        image_width: f.image_width,
        image_height: f.image_height,
      }))}
      seats={seats}
      initialSessions={sessions}
      initialProfiles={profiles}
      myUserId={user.id}
      isAdmin={admin}
    />
  );
}
