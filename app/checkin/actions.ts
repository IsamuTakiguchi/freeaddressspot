"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { checkIn, checkOut } from "@/lib/checkin";

// チェックイン実行（/checkin/[seatId] のボタンから呼ばれる。GETでは絶対に実行しない）
export async function checkInAction(formData: FormData) {
  const seatId = String(formData.get("seat_id") ?? "");
  const force = formData.get("force") === "1";
  if (!seatId) redirect("/map");

  const user = await requireUser(`/checkin/${seatId}`);
  const result = await checkIn(user.id, seatId, force);

  revalidatePath("/map");
  switch (result.status) {
    case "ok":
    case "already_here":
      redirect(`/checkin/${seatId}?done=1`);
    case "occupied":
      // レースで直前に他の人が座った場合: ページを再表示（占有状態の分岐が出る）
      redirect(`/checkin/${seatId}?occupied=1`);
    case "conflict":
      redirect(`/checkin/${seatId}?conflict=1`);
    case "invalid_seat":
      redirect(`/checkin/${seatId}?invalid=1`);
  }
}

// 退席（マップのステータスバーから）
export async function checkOutAction() {
  const user = await requireUser("/map");
  await checkOut(user.id);
  revalidatePath("/map");
}
