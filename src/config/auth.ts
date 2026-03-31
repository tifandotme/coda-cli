import { join } from "node:path";
import { homedir } from "node:os";
import { mkdir } from "node:fs/promises";

interface CodaConfig {
  token?: string;
}

function getConfigDir(): string {
  return join(homedir(), ".config", "coda-cli");
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

async function readConfig(): Promise<CodaConfig> {
  const path = getConfigPath();
  const file = Bun.file(path);
  const exists = await file.exists();
  if (!exists) return {};
  try {
    return await file.json() as CodaConfig;
  } catch {
    return {};
  }
}

async function writeConfig(config: CodaConfig): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await Bun.write(getConfigPath(), JSON.stringify(config, null, 2));
}

export async function getToken(): Promise<string | undefined> {
  // Env var takes priority
  if (process.env.CODA_API_TOKEN) {
    return process.env.CODA_API_TOKEN;
  }
  const config = await readConfig();
  return config.token;
}

export async function saveToken(token: string): Promise<void> {
  const config = await readConfig();
  config.token = token;
  await writeConfig(config);
}

export async function removeToken(): Promise<void> {
  const config = await readConfig();
  delete config.token;
  await writeConfig(config);
}

export async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    console.error(
      "No API token found. Run 'coda-cli login' or set the CODA_API_TOKEN environment variable."
    );
    process.exit(1);
  }
  return token;
}
