import type { Command } from "commander";
import * as readline from "node:readline";
import { CodaClient } from "../client/api.ts";
import { saveToken, removeToken, requireToken } from "../config/auth.ts";
import { printOutput } from "../utils/output.ts";
import { formatError } from "../utils/errors.ts";
import type { components } from "../types/openapi.d.ts";

type WhoAmIResult = components["schemas"]["User"];

export function registerAccountCommands(program: Command): void {
  program
    .command("login")
    .description("Authenticate with the Coda API using an API token")
    .action(async () => {
      const token = await promptSecret("Enter your Coda API token: ");
      if (!token) {
        console.error("No token provided.");
        process.exit(1);
      }

      // Validate token
      try {
        const client = new CodaClient(token);
        const user = await client.get<WhoAmIResult>("/whoami");
        await saveToken(token);
        console.log(`Logged in as ${(user as any).name ?? (user as any).login ?? "unknown"}`);
      } catch (err) {
        const fmt = (program.opts().format as "json" | "table") ?? "json";
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });

  program
    .command("logout")
    .description("Remove the stored Coda API token")
    .action(async () => {
      await removeToken();
      console.log("Logged out.");
    });

  program
    .command("whoami")
    .description("Show the current authenticated user")
    .action(async () => {
      const fmt = (program.optsWithGlobals().format as "json" | "table") ?? "json";
      try {
        const token = await requireToken();
        const client = new CodaClient(token);
        const user = await client.get<WhoAmIResult>("/whoami");
        printOutput(user, fmt);
      } catch (err) {
        console.error(formatError(err, fmt));
        process.exit(1);
      }
    });
}

function promptSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // If stdin is a TTY, suppress echo
    if (process.stdin.isTTY) {
      process.stdout.write(question);
      let input = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk: string) => {
        const char = chunk.toString();
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(input.trim());
        } else if (char === "\u0003") {
          process.stdout.write("\n");
          process.exit(0);
        } else if (char === "\u007F") {
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      });
    } else {
      // Not a TTY (e.g., piped input or agent)
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}
