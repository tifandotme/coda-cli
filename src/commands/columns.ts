import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { buildApiPath, normalizeDocId } from "../utils/coda-paths.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Column = components["schemas"]["Column"];
type ColumnList = components["schemas"]["ColumnList"];

export function registerColumnCommands(program: Command): void {
  const columns = program.command("columns").description("List columns in a table");

  columns
    .command("list <docId> <tableIdOrName>")
    .description("List columns in a table")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--visible-only", "Only return visible columns")
    .option("--all", "Fetch all pages")
    .action(async (docId, tableIdOrName, opts) => {
      const fmt = fmt_of(program);
      const columnsPath = buildApiPath("docs", normalizeDocId(docId), "tables", tableIdOrName, "columns");
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Column>((pageToken) =>
            client.get<ColumnList>(columnsPath, {
              pageToken,
              limit: parseInt(opts.limit),
              visibleOnly: opts.visibleOnly || undefined,
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<ColumnList>(columnsPath, {
            pageToken: opts.pageToken,
            limit: parseInt(opts.limit),
            visibleOnly: opts.visibleOnly || undefined,
          });
          printOutput(result, fmt);
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
