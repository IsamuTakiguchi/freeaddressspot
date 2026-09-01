// サンプル図面SVGを生成する（座席座標の定義は scripts/seed.mjs と一致させること）
import { writeFileSync } from "node:fs";

const W = 1600, H = 900;
const desks = []; // {label, cx, cy}

// 島型デスク: 2列x3行、デスク120x70
const islands = [
  { prefix: "A", ox: 200, oy: 150 },
  { prefix: "B", ox: 200, oy: 500 },
  { prefix: "C", ox: 620, oy: 150 },
  { prefix: "D", ox: 620, oy: 500 },
];
const DW = 130, DH = 78;
for (const isl of islands) {
  let n = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      desks.push({
        label: `${isl.prefix}-${n++}`,
        x: isl.ox + col * DW,
        y: isl.oy + row * DH,
      });
    }
  }
}
// 窓際カウンター席（上部）
for (let i = 0; i < 6; i++) {
  desks.push({ label: `W-${i + 1}`, x: 1050 + i * 90, y: 60, w: 80, h: 60 });
}

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="sans-serif">
<rect width="${W}" height="${H}" fill="#f8fafc"/>
<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="#ffffff" stroke="#334155" stroke-width="6"/>
<!-- 会議室 -->
<rect x="1180" y="330" width="380" height="240" fill="#eff6ff" stroke="#64748b" stroke-width="3"/>
<text x="1370" y="455" text-anchor="middle" fill="#64748b" font-size="28">会議室 1</text>
<rect x="1180" y="590" width="380" height="270" fill="#eff6ff" stroke="#64748b" stroke-width="3"/>
<text x="1370" y="730" text-anchor="middle" fill="#64748b" font-size="28">会議室 2</text>
<!-- リフレッシュスペース -->
<rect x="60" y="740" width="340" height="120" rx="12" fill="#f0fdf4" stroke="#86efac" stroke-width="3"/>
<text x="230" y="808" text-anchor="middle" fill="#16a34a" font-size="24">リフレッシュスペース</text>
<!-- エントランス -->
<rect x="700" y="854" width="200" height="12" fill="#94a3b8"/>
<text x="800" y="845" text-anchor="middle" fill="#64748b" font-size="22">エントランス</text>
`;
for (const d of desks) {
  const w = d.w ?? 120, h = d.h ?? 68;
  svg += `<rect x="${d.x}" y="${d.y}" width="${w}" height="${h}" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
<text x="${d.x + w / 2}" y="${d.y + h / 2 + 7}" text-anchor="middle" fill="#94a3b8" font-size="20">${d.label}</text>
`;
}
svg += "</svg>\n";
writeFileSync("public/floors/sample-floor.svg", svg);

console.log(`generated: ${desks.length} seats (seed data is in scripts/seed.mjs)`);
