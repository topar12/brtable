import { getSupabaseClient } from "./supabase";
import { getServerSupabaseClient } from "./supabase-ssr";

type ResultOk<T> = { ok: true; data: T };
type ResultErr = { ok: false; error: string };
export type Result<T> = ResultOk<T> | ResultErr;

export type BatchProgress = {
  completed: number;
  total: number;
  chunkSize: number;
  chunkIndex: number;
};

export type BatchOptions = {
  chunkSize?: number;
  onProgress?: (progress: BatchProgress) => void;
  returning?: boolean;
};

export type ListOptions = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
};

type LooseQuery = {
  select: (...args: unknown[]) => any;
  insert: (...args: unknown[]) => any;
  update: (...args: unknown[]) => any;
  delete: (...args: unknown[]) => any;
  order: (...args: unknown[]) => any;
  range: (...args: unknown[]) => any;
  eq: (...args: unknown[]) => any;
  in: (...args: unknown[]) => any;
  single: (...args: unknown[]) => any;
};

type LooseClient = {
  from: (table: string) => LooseQuery;
  rpc?: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function ensureSupabase() {
  // Try browser client first (has auth session for RLS policies), then server client for SSR
  const browserClient = getSupabaseClient();
  if (browserClient) {
    return { ok: true, client: browserClient as unknown as LooseClient } as const;
  }
  const serverClient = getServerSupabaseClient();
  if (serverClient) {
    return { ok: true, client: serverClient as unknown as LooseClient } as const;
  }
  return { ok: false, error: "Supabase 설정이 없습니다." } as const;
}

function tableRef(client: LooseClient, table: string) {
  return client.from(table);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류";
}

export async function fetchAll<T>(table: string, options: ListOptions = {}): Promise<Result<T[]>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  let query = tableRef(clientResult.client, table).select("*");
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  if (typeof options.limit === "number") {
    const offset = options.offset ?? 0;
    const to = offset + options.limit - 1;
    query = query.range(offset, Math.max(offset, to));
  }
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as T[] };
}

export async function fetchById<T>(table: string, id: string | number, idKey = "id"): Promise<Result<T>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { data, error } = await tableRef(clientResult.client, table)
    .select("*")
    .eq(idKey, id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as T };
}

export async function fetchListByField<T>(
  table: string,
  field: string,
  value: string | number,
  options: ListOptions = {},
): Promise<Result<T[]>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  let query = tableRef(clientResult.client, table).select("*").eq(field, value);
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  if (typeof options.limit === "number") {
    const offset = options.offset ?? 0;
    const to = offset + options.limit - 1;
    query = query.range(offset, Math.max(offset, to));
  }
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as T[] };
}

export async function fetchListByIn<T>(
  table: string,
  field: string,
  values: Array<string | number>,
  options: ListOptions = {},
): Promise<Result<T[]>> {
  if (!values.length) return { ok: true, data: [] as T[] };
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  let query = tableRef(clientResult.client, table).select("*").in(field, values);
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  if (typeof options.limit === "number") {
    const offset = options.offset ?? 0;
    const to = offset + options.limit - 1;
    query = query.range(offset, Math.max(offset, to));
  }
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as T[] };
}

export async function fetchUsersAuthInfo(
  userIds: string[],
): Promise<Result<Array<{ user_id: string; email: string | null; last_sign_in_at: string | null }>>> {
  if (!userIds.length) return { ok: true, data: [] };
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  if (!clientResult.client.rpc) {
    return { ok: false, error: "Supabase RPC를 사용할 수 없습니다." };
  }
  const { data, error } = await clientResult.client.rpc("get_users_auth_info", { uids: userIds });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []) as Array<{ user_id: string; email: string | null; last_sign_in_at: string | null }>,
  };
}

export async function createRow<T>(table: string, row: Record<string, unknown>): Promise<Result<T>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { data, error } = await tableRef(clientResult.client, table)
    .insert(row)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as T };
}

export async function updateRow<T>(
  table: string,
  id: string | number,
  patch: Record<string, unknown>,
  idKey = "id",
): Promise<Result<T>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { data, error } = await tableRef(clientResult.client, table)
    .update(patch)
    .eq(idKey, id)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as T };
}

export async function deleteRow(
  table: string,
  id: string | number,
  idKey = "id",
): Promise<Result<null>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { error } = await tableRef(clientResult.client, table).delete().eq(idKey, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function bulkUpdate<T>(
  table: string,
  ids: Array<string | number>,
  patch: Record<string, unknown>,
  idKey = "id",
): Promise<Result<T[]>> {
  if (!ids.length) return { ok: true, data: [] as T[] };
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { data, error } = await tableRef(clientResult.client, table)
    .update(patch)
    .in(idKey, ids)
    .select("*");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as T[] };
}

export async function bulkDelete(
  table: string,
  ids: Array<string | number>,
  idKey = "id",
): Promise<Result<null>> {
  if (!ids.length) return { ok: true, data: null };
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const { error } = await tableRef(clientResult.client, table).delete().in(idKey, ids);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function batchInsert<T>(
  table: string,
  rows: Record<string, unknown>[],
  options: BatchOptions = {},
): Promise<Result<T[]>> {
  const clientResult = ensureSupabase();
  if (!clientResult.ok) return clientResult;
  const chunkSize = options.chunkSize ?? 50;
  const returning = options.returning ?? true;
  const total = rows.length;
  const results: T[] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const query = tableRef(clientResult.client, table).insert(chunk);
    const { data, error } = returning ? await query.select("*") : await query;
    if (error) return { ok: false, error: error.message };
    if (returning && data) {
      results.push(...(data as T[]));
    }
    options.onProgress?.({
      completed: Math.min(index + chunk.length, total),
      total,
      chunkSize,
      chunkIndex: Math.floor(index / chunkSize),
    });
  }
  return { ok: true, data: results };
}

export function exportToJson<T>(rows: T[]) {
  return JSON.stringify(rows, null, 2);
}

export function parseJson<T>(payload: string): Result<T[]> {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "JSON은 배열이어야 합니다." };
    }
    return { ok: true, data: parsed as T[] };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/\"|,|\n/.test(text)) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export function exportToCsv(rows: Array<Record<string, unknown>>, columns?: string[]) {
  if (!rows.length && !columns?.length) return "";
  const headers = columns ?? Object.keys(rows[0] ?? {});
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const line = headers.map((key) => escapeCsvValue(row[key])).join(",");
    lines.push(line);
  });
  return lines.join("\n");
}

export function parseCsv(payload: string): Result<Record<string, string>[]> {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < payload.length; i += 1) {
    const char = payload[i];
    const next = payload[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      current.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
      continue;
    }
    field += char;
  }
  if (field.length || current.length) {
    current.push(field);
    rows.push(current);
  }
  if (!rows.length) return { ok: true, data: [] };
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
  return { ok: true, data };
}

export async function importFromCsv<T>(
  table: string,
  payload: string,
  options: BatchOptions = {},
): Promise<Result<T[]>> {
  const parsed = parseCsv(payload);
  if (!parsed.ok) return parsed;
  const rows = parsed.data.map((row) => ({ ...row }));
  return batchInsert<T>(table, rows, options);
}

export async function importFromJson<T>(
  table: string,
  payload: string,
  options: BatchOptions = {},
): Promise<Result<T[]>> {
  const parsed = parseJson<T>(payload);
  if (!parsed.ok) return parsed;
  const rows = parsed.data.map((row) => ({ ...(row as Record<string, unknown>) }));
  return batchInsert<T>(table, rows, options);
}
