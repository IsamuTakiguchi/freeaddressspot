// フロア図面の表示用URL。画像本体はDB内にあり /api/floors/[id]/image が配信する。
// image_updated_at をキャッシュバスターにして immutable キャッシュと両立させる
export function floorImageUrl(floor: {
  id: string;
  image_updated_at: string;
}): string {
  return `/api/floors/${floor.id}/image?v=${Date.parse(floor.image_updated_at)}`;
}
