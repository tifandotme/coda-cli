import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Control = components["schemas"]["Control"];
type ControlList = components["schemas"]["ControlList"];

export function registerControlCommands(program: Command): void {
  const controls = program.command("controls").description("List controls in a doc");

  controls
    .command("list <docId>")
    .description("List controls in a doc")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--all", "Fetch all pages")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Control>((pageToken) =>
            client.get<ControlList>(`/docs/${docId}/controls`, {
              pageToken,
              limit: parseInt(opts.limit),
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<ControlList>(`/docs/${docId}/controls`, {
            pageToken: opts.pageToken,
            limit: parseInt(opts.limit),
          });
          printOutput(result, fmt);
        }
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  controls
    .command("get <docId> <controlIdOrName>")
    .description("Get a control by ID or name")
    .action(async (docId, controlIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const control = await client.get<Control>(
          `/docs/${docId}/controls/${controlIdOrName}`
        );
        printOutput(control, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function fmt_of(program: Command): OutputFormat {
  return (program.optsWithGlobals().format as OutputFormat) ?? "json";
}
