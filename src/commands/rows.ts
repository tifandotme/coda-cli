import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Row = components["schemas"]["Row"];
type RowList = components["schemas"]["RowList"];
type RowsUpsert = components["schemas"]["RowsUpsert"];
type RowUpdate = components["schemas"]["RowUpdate"];
type RowsDelete = components["schemas"]["RowsDelete"];

export function registerRowCommands(program: Command): void {
  const rows = program.command("rows").description("Read and write rows in a table");

  rows
    .command("list <docId> <tableIdOrName>")
    .description("List rows in a table")
    .option("--query <query>", "Filter rows by a column value")
    .option("--sort-by <field>", "Sort rows by: createdAt, updatedAt, or natural")
    .option("--use-column-names", "Use column names instead of IDs in the response")
    .option("--value-format <format>", "Value format: simple, simpleWithArrays, or rich")
    .option("--visible-only", "Only return visible columns")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--sync-token <token>", "Sync token for incremental updates")
    .option("--all", "Fetch all pages")
    .action(async (docId, tableIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const baseParams = {
          query: opts.query,
          sortBy: opts.sortBy,
          useColumnNames: opts.useColumnNames || undefined,
          valueFormat: opts.valueFormat,
          visibleOnly: opts.visibleOnly || undefined,
          syncToken: opts.syncToken,
          limit: parseInt(opts.limit),
        };
        if (opts.all) {
          const items = await fetchAll<Row>((pageToken) =>
            client.get<RowList>(`/docs/${docId}/tables/${tableIdOrName}/rows`, {
              ...baseParams,
              pageToken,
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<RowList>(
            `/docs/${docId}/tables/${tableIdOrName}/rows`,
            { ...baseParams, pageToken: opts.pageToken }
          );
          printOutput(result, fmt);
        }
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  rows
    .command("get <docId> <tableIdOrName> <rowIdOrName>")
    .description("Get a row by ID or name")
    .option("--use-column-names", "Use column names instead of IDs in the response")
    .option("--value-format <format>", "Value format: simple, simpleWithArrays, or rich")
    .action(async (docId, tableIdOrName, rowIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const row = await client.get<Row>(
          `/docs/${docId}/tables/${tableIdOrName}/rows/${rowIdOrName}`,
          {
            useColumnNames: opts.useColumnNames || undefined,
            valueFormat: opts.valueFormat,
          }
        );
        printOutput(row, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  rows
    .command("upsert <docId> <tableIdOrName>")
    .description("Insert or upsert rows into a table")
    .requiredOption(
      "--cells <json>",
      "JSON array of cell objects: [{\"column\":\"<id>\",\"value\":\"<val>\"}] for one row, or [[{...}],[{...}]] for multiple rows"
    )
    .option(
      "--key-columns <cols>",
      "Comma-separated column IDs to use as merge keys (enables upsert)"
    )
    .option("--disable-parsing", "Disable automatic value parsing")
    .action(async (docId, tableIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cellsInput: any = parseJson(opts.cells);

        // Support both single row [{column, value}] and multi-row [[{...}],[{...}]]
        const rows: Array<{ cells: Array<{ column: string; value: unknown }> }> =
          Array.isArray(cellsInput[0])
            ? (cellsInput as any[][]).map((cells) => ({ cells }))
            : [{ cells: cellsInput as any[] }];

        const body: RowsUpsert = {
          rows: rows as RowsUpsert["rows"],
          keyColumns: opts.keyColumns ? opts.keyColumns.split(",") : undefined,
        };
        const client = await getClient();
        const path = opts.disableParsing
          ? `/docs/${docId}/tables/${tableIdOrName}/rows?disableParsing=true`
          : `/docs/${docId}/tables/${tableIdOrName}/rows`;
        const result = await client.post(path, body);
        printOutput(result, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  rows
    .command("update <docId> <tableIdOrName> <rowIdOrName>")
    .description("Update a row")
    .requiredOption(
      "--cells <json>",
      "JSON array of cell objects: [{\"column\":\"<id>\",\"value\":\"<val>\"}]"
    )
    .option("--disable-parsing", "Disable automatic value parsing")
    .action(async (docId, tableIdOrName, rowIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const cells = parseJson(opts.cells);
        const body: RowUpdate = {
          row: { cells: cells as RowUpdate["row"]["cells"] },
        };
        const client = await getClient();
        const rowPath = opts.disableParsing
          ? `/docs/${docId}/tables/${tableIdOrName}/rows/${rowIdOrName}?disableParsing=true`
          : `/docs/${docId}/tables/${tableIdOrName}/rows/${rowIdOrName}`;
        const result = await client.put(rowPath, body);
        printOutput(result, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  rows
    .command("delete <docId> <tableIdOrName>")
    .description("Delete rows from a table")
    .requiredOption("--row-ids <ids>", "Comma-separated row IDs to delete")
    .action(async (docId, tableIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const rowIds = opts.rowIds.split(",").map((id: string) => id.trim());
        const body: RowsDelete = { rowIds };
        const client = await getClient();
        await client.delete(
          `/docs/${docId}/tables/${tableIdOrName}/rows`,
          body
        );
        if (fmt === "json") {
          console.log(JSON.stringify({ deleted: true, rowIds }));
        } else {
          console.log(`Deleted ${rowIds.length} row(s)`);
        }
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function fmt_of(program: Command): OutputFormat {
  return (program.optsWithGlobals().format as OutputFormat) ?? "json";
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    throw new Error(`Invalid JSON: ${input}`);
  }
}
