import { Command } from "commander";
import { registerAccountCommands } from "./commands/account.ts";
import { registerDocCommands } from "./commands/docs.ts";
import { registerTableCommands } from "./commands/tables.ts";
import { registerColumnCommands } from "./commands/columns.ts";
import { registerRowCommands } from "./commands/rows.ts";
import { registerPageCommands } from "./commands/pages.ts";
import { registerFormulaCommands } from "./commands/formulas.ts";
import { registerControlCommands } from "./commands/controls.ts";

const program = new Command();

program
  .name("codaio")
  .description("CLI for the Coda API v1")
  .version("0.1.0")
  .option("--format <format>", "Output format: json (default) or table", "json");

registerAccountCommands(program);
registerDocCommands(program);
registerTableCommands(program);
registerColumnCommands(program);
registerRowCommands(program);
registerPageCommands(program);
registerFormulaCommands(program);
registerControlCommands(program);

program.parse();
