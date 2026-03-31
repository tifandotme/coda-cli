import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Formula = components["schemas"]["Formula"];
type FormulaList = components["schemas"]["FormulaList"];

export function registerFormulaCommands(program: Command): void {
  const formulas = program.command("formulas").description("List formulas in a doc");

  formulas
    .command("list <docId>")
    .description("List formulas in a doc")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--all", "Fetch all pages")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Formula>((pageToken) =>
            client.get<FormulaList>(`/docs/${docId}/formulas`, {
              pageToken,
              limit: parseInt(opts.limit),
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<FormulaList>(`/docs/${docId}/formulas`, {
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

  formulas
    .command("get <docId> <formulaIdOrName>")
    .description("Get a formula by ID or name")
    .action(async (docId, formulaIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const formula = await client.get<Formula>(
          `/docs/${docId}/formulas/${formulaIdOrName}`
        );
        printOutput(formula, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function fmt_of(program: Command): OutputFormat {
  return (program.optsWithGlobals().format as OutputFormat) ?? "json";
}
