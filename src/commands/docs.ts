import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Doc = components["schemas"]["Doc"];
type DocList = components["schemas"]["DocList"];
type DocCreate = components["schemas"]["DocCreate"];

export function registerDocCommands(program: Command): void {
  const docs = program.command("docs").description("Manage Coda docs");

  docs
    .command("list")
    .description("List docs accessible to the current user")
    .option("--query <query>", "Filter docs by title")
    .option("--is-owner", "Only include docs owned by the current user")
    .option("--is-starred", "Only include starred docs")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--all", "Fetch all pages")
    .action(async (opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Doc>((pageToken) =>
            client.get<DocList>("/docs", {
              query: opts.query,
              isOwner: opts.isOwner || undefined,
              isStarred: opts.isStarred || undefined,
              pageToken,
              limit: parseInt(opts.limit),
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<DocList>("/docs", {
            query: opts.query,
            isOwner: opts.isOwner || undefined,
            isStarred: opts.isStarred || undefined,
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

  docs
    .command("get <docId>")
    .description("Get a doc by ID")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const doc = await client.get<Doc>(`/docs/${docId}`);
        printOutput(doc, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  docs
    .command("create")
    .description("Create a new doc")
    .requiredOption("--title <title>", "Title of the new doc")
    .option("--source-doc <id>", "ID of a source doc to copy")
    .option("--folder-id <id>", "ID of the folder to place the doc in")
    .option("--timezone <tz>", "Timezone for the doc (e.g. America/New_York)")
    .action(async (opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const body: DocCreate = {
          title: opts.title,
          sourceDoc: opts.sourceDoc,
          folderId: opts.folderId,
          timezone: opts.timezone,
        };
        const doc = await client.post<Doc>("/docs", body);
        printOutput(doc, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  docs
    .command("delete <docId>")
    .description("Delete a doc")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        await client.delete(`/docs/${docId}`);
        if (fmt === "json") {
          console.log(JSON.stringify({ deleted: true, docId }));
        } else {
          console.log(`Deleted doc ${docId}`);
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
