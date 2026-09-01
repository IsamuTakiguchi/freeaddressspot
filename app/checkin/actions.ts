"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CheckInResult } from "@/lib/database.types";

// チェックイン実行（/checkin/[seatId] のボタンから呼ばれる。GETでは絶対に実行しない）
export async function checkInAction(formData: FormData) {
  const seatId = String(formData.get("seat_id") ?? "");
  const force = formData.get("force") === "1";
  if (!seatId) redirect("/map");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${seatId}`)}`);

  const { data, error } = await supabase.rpc("check_in", {
    p_seat_id: seatId,
    p_force: force,
  });
  if (error) {
    redirect(`/checkin/${seatId}?error=${encodeURIComponent(error.message)}`);
  }

  const result = data as unknown as CheckInResult;
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("check_out");
  if (error) throw new Error(error.message);
  revalidatePath("/map");
}
