import { Pool, type QueryResultRow } from "pg";

// pg.Pool のシングルトン（devのHMRで増殖しないよう globalThis にキャッシュ）
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Railway内部ネットワーク（postgres.railway.internal）はSSL不要。
      // 外部URL経由で接続する場合のみ PGSSL=1 を設定する
      ssl:
        process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalForDb.pgPool;
}

// クエリヘルパ。numeric は string、timestamptz は Date で返るため、
// 呼び出し側の型契約（x/y: number、日時: ISO string）への変換は rowMapper で行う
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export const toIso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : v;
