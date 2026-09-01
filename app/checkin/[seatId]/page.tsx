import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkInAction } from "@/app/checkin/actions";

export const dynamic = "force-dynamic";

// NFCタグの着地点。GETでは状態表示のみ行い、チェックインは必ずPOST（Server Action）で実行する
// （メッセージアプリのリンクプレビューやプリフェッチによる誤着席を防ぐため）
export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ seatId: string }>;
  searchParams: Promise<{
    done?: string;
    occupied?: string;
    conflict?: string;
    invalid?: string;
    error?: string;
  }>;
}) {
  const { seatId } = await params;
  const flags = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/checkin/${seatId}`)}`);
  }

  const { data: seat } = await supabase
    .from("seats")
    .select("id, label, is_active, floor_id")
    .eq("id", seatId)
    .maybeSingle();

  if (!seat || !seat.is_active || flags.invalid) {
    return (
      <Shell>
        <p className="text-lg font-bold text-gray-900">
          この座席は見つかりません
        </p>
        <p className="mt-2 text-sm text-gray-500">
          座席が削除されたか、無効化された可能性があります。管理者にお問い合わせください。
        </p>
        <MapLink />
      </Shell>
    );
  }

  const [floorRes, occupantRes, mySessionRes] = await Promise.all([
    supabase.from("floors").select("name").eq("id", seat.floor_id).single(),
    supabase
      .from("seat_sessions")
      .select("user_id")
      .eq("seat_id", seatId)
      .is("checked_out_at", null)
      .maybeSingle(),
    supabase
      .from("seat_sessions")
      .select("seat_id")
      .eq("user_id", user.id)
      .is("checked_out_at", null)
      .maybeSingle(),
  ]);

  const floorName = floorRes.data?.name ?? "";
  const seatTitle = `${floorName} ${seat.label}`.trim();
  const occupant = occupantRes.data;

  let occupantName = "利用者";
  if (occupant && occupant.user_id !== user.id) {
    const { data: occupantProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", occupant.user_id)
      .maybeSingle();
    if (occupantProfile) occupantName = occupantProfile.display_name;
  }

  let mySeatLabel: string | null = null;
  const mySeatId = mySessionRes.data?.seat_id;
  if (mySeatId && mySeatId !== seatId) {
    const { data: mySeat } = await supabase
      .from("seats")
      .select("label")
      .eq("id", mySeatId)
      .maybeSingle();
    mySeatLabel = mySeat?.label ?? null;
  }

  // チェックイン完了
  if (flags.done) {
    return (
      <Shell>
        <div className="text-5xl">✅</div>
        <p className="mt-3 text-lg font-bold text-gray-900">
          {seatTitle} にチェックインしました
        </p>
        <MapLink primary />
      </Shell>
    );
  }

  const isMe = occupant?.user_id === user.id;
  const isOccupiedByOther = !!occupant && !isMe;

  return (
    <Shell>
      <p className="text-sm text-gray-500">{floorName}</p>
      <p className="text-2xl font-bold text-gray-900">{seat.label}</p>

      {flags.conflict && (
        <Alert>他の方が先にチェックインしました。状態を確認してください。</Alert>
      )}
      {flags.error && <Alert>{flags.error}</Alert>}

      {isMe ? (
        <>
          <p className="mt-4 text-sm text-emerald-700">
            この席にチェックイン済みです
          </p>
          <MapLink primary />
        </>
      ) : isOccupiedByOther ? (
        <>
          <p className="mt-4 text-sm text-gray-700">
            現在 <span className="font-bold">{occupantName}</span> さんが使用中です
          </p>
          <form action={checkInAction} className="mt-4">
            <input type="hidden" name="seat_id" value={seat.id} />
            <input type="hidden" name="force" value="1" />
            <button className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100">
              この席を使う
              <span className="block text-xs font-normal">
                （{occupantName} さんを退席扱いにします）
              </span>
            </button>
          </form>
          <MapLink />
        </>
      ) : (
        <>
          <form action={checkInAction} className="mt-6">
            <input type="hidden" name="seat_id" value={seat.id} />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-bold text-white shadow hover:bg-blue-700">
              {mySeatLabel
                ? `${mySeatLabel} から移動してチェックイン`
                : "この席にチェックイン"}
            </button>
          </form>
          <MapLink />
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow">
        {children}
      </div>
    </main>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
      {children}
    </p>
  );
}

function MapLink({ primary }: { primary?: boolean }) {
  return (
    <Link
      href="/map"
      className={
        primary
          ? "mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-bold text-white shadow hover:bg-blue-700"
          : "mt-4 block text-sm text-blue-700 hover:underline"
      }
    >
      座席マップを見る
    </Link>
  );
}
