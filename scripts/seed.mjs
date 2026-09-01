// サンプルデータ投入（動作確認用・冪等）
// サンプル図面SVGをDBに格納し、30席を登録する
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FLOOR_ID = "11111111-1111-4111-8111-111111111111";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
});
await client.connect();

const svg = await readFile(join(root, "public/floors/sample-floor.svg"));

await client.query(
  `insert into floors (id, name, image_data, image_mime, image_width, image_height, sort_order)
   values ($1, 'サンプルオフィス 1F', $2, 'image/svg+xml', 1600, 900, 0)
   on conflict (id) do nothing`,
  [FLOOR_ID, svg]
);

// scripts/gen-sample-floor.mjs と同一の座席定義から座標を再計算
const W = 1600, H = 900;
const desks = [];
const islands = [
  { prefix: "A", ox: 200, oy: 150 },
  { prefix: "B", ox: 200, oy: 500 },
  { prefix: "C", ox: 620, oy: 150 },
  { prefix: "D", ox: 620, oy: 500 },
];
for (const isl of islands) {
  let n = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      desks.push({ label: `${isl.prefix}-${n++}`, x: isl.ox + col * 130, y: isl.oy + row * 78 });
    }
  }
}
for (let i = 0; i < 6; i++) {
  desks.push({ label: `W-${i + 1}`, x: 1050 + i * 90, y: 60, w: 80, h: 60 });
}

for (const d of desks) {
  const w = d.w ?? 120, h = d.h ?? 68;
  await client.query(
    `insert into seats (floor_id, label, x, y) values ($1, $2, $3, $4)
     on conflict (floor_id, label) do nothing`,
    [FLOOR_ID, d.label, ((d.x + w / 2) / W).toFixed(6), ((d.y + h / 2) / H).toFixed(6)]
  );
}

console.log(`seeded: 1 floor, ${desks.length} seats`);
await client.end();
