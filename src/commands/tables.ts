import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Table = components["schemas"]["Table"];
type TableList = components["schemas"]["TableList"];

export function registerTableCommands(program: Command): void {
  const tables = program.command("tables").description("Manage tables and views in a doc");

  tables
    .command("list <docId>")
    .description("List tables in a doc")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--all", "Fetch all pages")
    .option("--table-types <types>", "Comma-separated table types to filter by (table, view, etc.)")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Table>((pageToken) =>
            client.get<TableList>(`/docs/${docId}/tables`, {
              pageToken,
              limit: parseInt(opts.limit),
              tableTypes: opts.tableTypes,
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<TableList>(`/docs/${docId}/tables`, {
            pageToken: opts.pageToken,
            limit: parseInt(opts.limit),
            tableTypes: opts.tableTypes,
          });
          printOutput(result, fmt);
        }
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  tables
    .command("get <docId> <tableIdOrName>")
    .description("Get a table by ID or name")
    .action(async (docId, tableIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const table = await client.get<Table>(`/docs/${docId}/tables/${tableIdOrName}`);
        printOutput(table, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function fmt_of(program: Command): OutputFormat {
  return (program.optsWithGlobals().format as OutputFormat) ?? "json";
}
