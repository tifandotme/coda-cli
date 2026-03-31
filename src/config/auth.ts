import { join } from "node:path";
import { homedir } from "node:os";
import { mkdir } from "node:fs/promises";

interface CodaConfig {
  token?: string;
}

const CONFIG_DIR_NAME = "codaio";
const LEGACY_CONFIG_DIR_NAME = "coda-cli";

function getConfigDir(dirName = CONFIG_DIR_NAME): string {
  return join(homedir(), ".config", dirName);
}

function getConfigPath(dirName = CONFIG_DIR_NAME): string {
  return join(getConfigDir(dirName), "config.json");
}

async function resolveConfigPath(): Promise<string> {
  const preferredPath = getConfigPath();
  if (await Bun.file(preferredPath).exists()) {
    return preferredPath;
  }

  const legacyPath = getConfigPath(LEGACY_CONFIG_DIR_NAME);
  if (await Bun.file(legacyPath).exists()) {
    return legacyPath;
  }

  return preferredPath;
}

async function readConfig(): Promise<CodaConfig> {
  const path = await resolveConfigPath();
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
      "No API token found. Run 'codaio login' or set the CODA_API_TOKEN environment variable."
    );
    process.exit(1);
  }
  return token;
}
