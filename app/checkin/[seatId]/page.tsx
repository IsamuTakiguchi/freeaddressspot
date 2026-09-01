import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getFloorName,
  getMyActiveSeat,
  getSeat,
  getSeatOccupant,
} from "@/lib/queries";
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
  const user = await requireUser(`/checkin/${seatId}`);

  // UUID以外はDBに投げず404扱い
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      seatId
    );
  const seat = isUuid ? await getSeat(seatId) : null;

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

  const [floorName, occupant, mySeat] = await Promise.all([
    getFloorName(seat.floor_id),
    getSeatOccupant(seat.id),
    getMyActiveSeat(user.id),
  ]);

  const seatTitle = `${floorName} ${seat.label}`.trim();
  const occupantName = occupant?.display_name ?? "利用者";
  const mySeatLabel =
    mySeat && mySeat.seat_id !== seat.id ? mySeat.label : null;

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
