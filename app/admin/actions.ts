"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { query, queryOne, toIso } from "@/lib/db";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface AdminFloor {
  id: string;
  name: string;
  image_updated_at: string;
  image_width: number;
  image_height: number;
  sort_order: number;
}

// フロア追加（図面画像はDBにbytea格納。幅高さはクライアント計測値を数値検証して受ける）
export async function createFloorAction(
  formData: FormData
): Promise<ActionResult<AdminFloor>> {
  await requireAdmin("/admin");

  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("image");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name) return { ok: false, error: "フロア名を入力してください" };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "図面画像を選択してください" };
  if (!ALLOWED_MIME.has(file.type))
    return { ok: false, error: "画像はPNG/JPEG/SVG/WebPのみ対応です" };
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, error: "画像サイズは8MB以下にしてください" };
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    return { ok: false, error: "画像サイズを取得できませんでした" };

  const buf = Buffer.from(await file.arrayBuffer());
  const row = await queryOne<{
    id: string;
    name: string;
    image_updated_at: Date;
    image_width: number;
    image_height: number;
    sort_order: number;
  }>(
    `insert into floors (name, image_data, image_mime, image_width, image_height, sort_order)
     values ($1, $2, $3, $4, $5, $6)
     returning id, name, image_updated_at, image_width, image_height, sort_order`,
    [name, buf, file.type, width, height, Number.isFinite(sortOrder) ? sortOrder : 0]
  );
  return {
    ok: true,
    data: { ...row!, image_updated_at: toIso(row!.image_updated_at)! },
  };
}

export async function deleteFloorAction(
  floorId: string
): Promise<ActionResult> {
  await requireAdmin("/admin");
  await query("delete from floors where id = $1", [floorId]);
  return { ok: true, data: undefined };
}

export interface AdminSeat {
  id: string;
  floor_id: string;
  label: string;
  x: number;
  y: number;
  is_active: boolean;
}

export async function createSeatAction(input: {
  floorId: string;
  label: string;
  x: number;
  y: number;
}): Promise<ActionResult<AdminSeat>> {
  await requireAdmin("/admin");
  const label = input.label.trim();
  if (!label) return { ok: false, error: "座席名を入力してください" };
  if (!(input.x >= 0 && input.x <= 1 && input.y >= 0 && input.y <= 1))
    return { ok: false, error: "座標が不正です" };

  try {
    const row = await queryOne<{
      id: string;
      floor_id: string;
      label: string;
      x: string;
      y: string;
      is_active: boolean;
    }>(
      `insert into seats (floor_id, label, x, y) values ($1, $2, $3, $4)
       returning id, floor_id, label, x, y, is_active`,
      [input.floorId, label, input.x.toFixed(6), input.y.toFixed(6)]
    );
    return {
      ok: true,
      data: { ...row!, x: Number(row!.x), y: Number(row!.y) },
    };
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { ok: false, error: `座席名「${label}」は既に使われています` };
    throw e;
  }
}

export async function updateSeatPositionAction(input: {
  seatId: string;
  x: number;
  y: number;
}): Promise<ActionResult> {
  await requireAdmin("/admin");
  if (!(input.x >= 0 && input.x <= 1 && input.y >= 0 && input.y <= 1))
    return { ok: false, error: "座標が不正です" };
  await query("update seats set x = $1, y = $2 where id = $3", [
    input.x.toFixed(6),
    input.y.toFixed(6),
    input.seatId,
  ]);
  return { ok: true, data: undefined };
}

export async function updateSeatLabelAction(input: {
  seatId: string;
  label: string;
}): Promise<ActionResult> {
  await requireAdmin("/admin");
  const label = input.label.trim();
  if (!label) return { ok: false, error: "座席名を入力してください" };
  try {
    await query("update seats set label = $1 where id = $2", [
      label,
      input.seatId,
    ]);
    return { ok: true, data: undefined };
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { ok: false, error: `座席名「${label}」は既に使われています` };
    throw e;
  }
}

export async function toggleSeatActiveAction(input: {
  seatId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  await requireAdmin("/admin");
  await query("update seats set is_active = $1 where id = $2", [
    input.isActive,
    input.seatId,
  ]);
  return { ok: true, data: undefined };
}

export async function deleteSeatAction(seatId: string): Promise<ActionResult> {
  await requireAdmin("/admin");
  await query("delete from seats where id = $1", [seatId]);
  return { ok: true, data: undefined };
}

// ---- 個別許可メールアドレス管理 ----

export interface AllowedEmail {
  email: string;
  note: string | null;
  created_at: string;
}

export async function addAllowedEmailAction(input: {
  email: string;
  note?: string;
}): Promise<ActionResult<AllowedEmail>> {
  await requireAdmin("/admin");
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "メールアドレスの形式が正しくありません" };
  }
  const note = input.note?.trim() || null;
  try {
    const row = await queryOne<{
      email: string;
      note: string | null;
      created_at: Date;
    }>(
      `insert into allowed_emails (email, note) values ($1, $2)
       returning email, note, created_at`,
      [email, note]
    );
    return {
      ok: true,
      data: { ...row!, created_at: toIso(row!.created_at)! },
    };
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { ok: false, error: `${email} は既に登録されています` };
    throw e;
  }
}

export async function removeAllowedEmailAction(
  email: string
): Promise<ActionResult> {
  await requireAdmin("/admin");
  await query("delete from allowed_emails where email = $1", [
    email.trim().toLowerCase(),
  ]);
  return { ok: true, data: undefined };
}
