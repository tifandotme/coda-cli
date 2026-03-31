export type OutputFormat = "json" | "table";

export function printOutput(data: unknown, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  // Table mode
  if (Array.isArray(data)) {
    printTable(data);
  } else if (data && typeof data === "object") {
    printKeyValue(data as Record<string, unknown>);
  } else {
    console.log(String(data));
  }
}

function printTable(rows: unknown[]): void {
  if (rows.length === 0) {
    console.log("(no results)");
    return;
  }

  const first = rows[0];
  if (!first || typeof first !== "object") {
    rows.forEach((r) => console.log(String(r)));
    return;
  }

  const keys = Object.keys(first as object);
  const allRows = rows as Record<string, unknown>[];

  // Compute column widths
  const widths: number[] = keys.map((k) => k.length);
  for (const row of allRows) {
    keys.forEach((k, i) => {
      const val = stringify(row[k]);
      if (val.length > widths[i]!) widths[i] = val.length;
    });
  }

  // Cap column width at 60
  const capped = widths.map((w) => Math.min(w, 60));

  const header = keys.map((k, i) => k.padEnd(capped[i]!)).join("  ");
  const divider = capped.map((w) => "-".repeat(w)).join("  ");

  console.log(header);
  console.log(divider);
  for (const row of allRows) {
    const line = keys
      .map((k, i) => truncate(stringify(row[k]), capped[i]!).padEnd(capped[i]!))
      .join("  ");
    console.log(line);
  }
}

function printKeyValue(obj: Record<string, unknown>): void {
  const keyWidth = Math.max(...Object.keys(obj).map((k) => k.length), 0);
  for (const [k, v] of Object.entries(obj)) {
    console.log(`${k.padEnd(keyWidth)}  ${stringify(v)}`);
  }
}

function stringify(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}
