import Link from "next/link";
import { LogoMark } from "@/components/Logo";
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
            <button className="w-full rounded-full bg-amber-100 px-4 py-3.5 text-sm font-semibold text-amber-900 transition-colors active:bg-amber-200">
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
            <button className="min-h-13 w-full rounded-full bg-blue-600 px-4 text-base font-semibold text-white shadow-sm transition-colors active:bg-blue-700">
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
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex justify-center">
          <LogoMark size={40} />
        </div>
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
          ? "mt-6 block min-h-13 w-full rounded-full bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors active:bg-blue-700"
          : "mt-4 block py-2 text-sm font-medium text-blue-600 active:opacity-60"
      }
    >
      座席マップを見る
    </Link>
  );
}
