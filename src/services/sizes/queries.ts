import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SizeTableRecord } from "@/types/database";

type SizeTableQueryRecord = SizeTableRecord & {
  size_table_rows: SizeTableRecord["size_table_rows"];
};

function buildCanonicalSizeTable(sizeTables: SizeTableQueryRecord[]) {
  if (sizeTables.length === 0) {
    return null;
  }

  if (sizeTables.length > 1) {
    console.warn("Multiple size_tables found for order; consolidating rows into canonical table.", {
      orderId: sizeTables[0]?.order_id,
      sizeTableIds: sizeTables.map((table) => table.id),
    });
  }

  const canonicalTable = sizeTables[0];
  const mergedRows = sizeTables
    .flatMap((table) => table.size_table_rows ?? [])
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      const pieceDiff = (a.piece_index ?? Number.MAX_SAFE_INTEGER) -
        (b.piece_index ?? Number.MAX_SAFE_INTEGER);

      if (pieceDiff !== 0) {
        return pieceDiff;
      }

      return a.created_at.localeCompare(b.created_at);
    });

  return {
    ...canonicalTable,
    size_table_rows: mergedRows,
  } satisfies SizeTableRecord;
}

export async function getFreshSizeTableByOrderId(
  orderId: string,
): Promise<SizeTableRecord | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("size_tables")
    .select("*, size_table_rows(*)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .order("sort_order", {
      foreignTable: "size_table_rows",
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return buildCanonicalSizeTable((data ?? []) as SizeTableQueryRecord[]);
}

export const getSizeTableByOrderId = cache(
  async (orderId: string): Promise<SizeTableRecord | null> => getFreshSizeTableByOrderId(orderId),
);
