import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { businessDays, resolveRange } from "@/lib/report-range";
import BarList from "@/components/reports/BarList";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/map");

  const range = resolveRange(rangeParam);
  const bizDays = businessDays(range.from, range.to);

  const [attendanceRes, usageRes, seatCountRes] = await Promise.all([
    supabase
      .from("attendance_days")
      .select("day, user_id, display_name, department")
      .gte("day", range.from)
      .lte("day", range.to),
    supabase
      .from("seat_usage_days")
      .select("day, seat_id, label, floor_name")
      .gte("day", range.from)
      .lte("day", range.to),
    supabase.from("seats").select("id, label, floor_id").eq("is_active", true),
  ]);

  const attendance = attendanceRes.data ?? [];
  const usage = usageRes.data ?? [];
  const activeSeats = seatCountRes.data ?? [];

  // 日別出社人数
  const byDay = new Map<string, number>();
  for (const a of attendance) {
    byDay.set(a.day, (byDay.get(a.day) ?? 0) + 1);
  }
  const dailyItems = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => {
      const d = new Date(`${day}T00:00:00Z`);
      const dow = "日月火水木金土"[d.getUTCDay()];
      return {
        label: `${day.slice(5).replace("-", "/")} (${dow})`,
        value: count,
        display: `${count}人`,
      };
    });

  // 部署別のべ出社日数
  const byDept = new Map<string, number>();
  for (const a of attendance) {
    const dept = a.department ?? "（部署未設定）";
    byDept.set(dept, (byDept.get(dept) ?? 0) + 1);
  }
  const deptItems = [...byDept.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([dept, count]) => ({
      label: dept,
      value: count,
      display: `${count}人日`,
    }));

  // 席別稼働率（利用日数 / 営業日数）
  const bySeat = new Map<string, { label: string; floor: string; days: number }>();
  for (const u of usage) {
    const entry = bySeat.get(u.seat_id) ?? {
      label: u.label,
      floor: u.floor_name,
      days: 0,
    };
    entry.days += 1;
    bySeat.set(u.seat_id, entry);
  }
  const seatItems = [...bySeat.values()]
    .sort((a, b) => b.days - a.days)
    .slice(0, 30)
    .map((s) => ({
      label: s.label,
      sub: s.floor,
      value: s.days,
      display: `${s.days}日 (${bizDays ? Math.round((s.days / bizDays) * 100) : 0}%)`,
    }));

  // 全体サマリ
  const uniqueUsers = new Set(attendance.map((a) => a.user_id)).size;
  const totalSeatDays = usage.length;
  const capacity = activeSeats.length * bizDays;
  const overallUtilization = capacity
    ? Math.round((totalSeatDays / capacity) * 100)
    : 0;

  const presets = [
    { key: "7", label: "直近7日" },
    { key: "30", label: "直近30日" },
    { key: "90", label: "直近90日" },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">利用状況レポート</h1>
        <Link href="/map" className="text-sm text-blue-700 hover:underline">
          ← 座席マップ
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {presets.map((p) => (
          <Link
            key={p.key}
            href={`/reports?range=${p.key}`}
            className={`rounded-full px-3 py-1 ${
              (rangeParam ?? "30") === p.key
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <span className="text-xs text-gray-500">
          {range.from} 〜 {range.to}（営業日 {bizDays}日・土日除く）
        </span>
        <a
          href={`/reports/csv?range=${rangeParam ?? "30"}`}
          className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          CSVダウンロード
        </a>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="出社した人数" value={`${uniqueUsers}人`} />
        <StatCard label="のべ出社人日" value={`${attendance.length}人日`} />
        <StatCard label="有効座席数" value={`${activeSeats.length}席`} />
        <StatCard label="平均座席稼働率" value={`${overallUtilization}%`} />
      </section>

      <Section title="日別出社人数">
        <BarList items={dailyItems} />
      </Section>

      <Section title="部署別のべ出社日数">
        <BarList items={deptItems} />
      </Section>

      <Section title={`座席別利用日数（上位${Math.min(30, seatItems.length)}席）`}>
        <BarList items={seatItems} />
      </Section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
