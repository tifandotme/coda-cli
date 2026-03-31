import type { Command } from "commander";
import { getClient } from "../client/api.ts";
import { fetchAll } from "../client/paginator.ts";
import { printOutput, type OutputFormat } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type Page = components["schemas"]["Page"];
type PageList = components["schemas"]["PageList"];
type PageUpdate = components["schemas"]["PageUpdate"];
type BeginPageContentExportRequest = components["schemas"]["BeginPageContentExportRequest"];

export function registerPageCommands(program: Command): void {
  const pages = program.command("pages").description("Manage pages in a doc");

  pages
    .command("list <docId>")
    .description("List pages in a doc")
    .option("--limit <n>", "Maximum number of results per page", "25")
    .option("--page-token <token>", "Page token for pagination")
    .option("--all", "Fetch all pages")
    .action(async (docId, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        if (opts.all) {
          const items = await fetchAll<Page>((pageToken) =>
            client.get<PageList>(`/docs/${docId}/pages`, {
              pageToken,
              limit: parseInt(opts.limit),
            })
          );
          printOutput(items, fmt);
        } else {
          const result = await client.get<PageList>(`/docs/${docId}/pages`, {
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

  pages
    .command("get <docId> <pageIdOrName>")
    .description("Get a page by ID or name")
    .action(async (docId, pageIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const page = await client.get<Page>(`/docs/${docId}/pages/${pageIdOrName}`);
        printOutput(page, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  pages
    .command("update <docId> <pageIdOrName>")
    .description("Update a page's metadata")
    .option("--name <name>", "New name for the page")
    .option("--subtitle <subtitle>", "New subtitle for the page")
    .option("--icon-name <icon>", "Icon name for the page")
    .option("--image-url <url>", "Cover image URL for the page")
    .option("--is-hidden", "Hide the page from the table of contents")
    .action(async (docId, pageIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const body: PageUpdate = {
          name: opts.name,
          subtitle: opts.subtitle,
          iconName: opts.iconName,
          imageUrl: opts.imageUrl,
        };
        const page = await client.put<Page>(`/docs/${docId}/pages/${pageIdOrName}`, body);
        printOutput(page, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  pages
    .command("export <docId> <pageIdOrName>")
    .description("Export a page to HTML or Markdown")
    .requiredOption("--output-format <format>", "Export format: html or markdown")
    .option("--timeout <ms>", "Polling timeout in milliseconds", "60000")
    .action(async (docId, pageIdOrName, opts) => {
      const fmt = fmt_of(program);
      try {
        const client = await getClient();
        const body: BeginPageContentExportRequest = { outputFormat: opts.outputFormat as any };
        const initial = await client.post<{ id: string; status: string; href: string }>(
          `/docs/${docId}/pages/${pageIdOrName}/export`,
          body
        );

        // Poll for completion
        const requestId = initial.id;
        const timeoutMs = parseInt(opts.timeout);
        const deadline = Date.now() + timeoutMs;

        let result = initial;
        while (result.status !== "complete" && result.status !== "failed") {
          if (Date.now() > deadline) {
            console.error(
              formatError(new Error("Export timed out. Check export status manually."), fmt)
            );
            process.exit(1);
          }
          await sleep(1500);
          result = await client.get<any>(
            `/docs/${docId}/pages/${pageIdOrName}/export/${requestId}`
          );
        }

        if (result.status === "failed") {
          console.error(formatError(new Error("Export failed."), fmt));
          process.exit(1);
        }

        printOutput(result, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function fmt_of(program: Command): OutputFormat {
  return (program.optsWithGlobals().format as OutputFormat) ?? "json";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
