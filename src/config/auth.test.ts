import { test, expect, beforeEach, afterEach } from "bun:test";
import { getToken, saveToken, removeToken } from "./auth.ts";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const configDir = join(homedir(), ".config", "codaio");
const configPath = join(configDir, "config.json");
const legacyConfigDir = join(homedir(), ".config", "coda-cli");
const legacyConfigPath = join(legacyConfigDir, "config.json");

// Save original env and config, restore after each test
let originalEnv: string | undefined;
let originalConfig: string | undefined;
let originalLegacyConfig: string | undefined;

beforeEach(async () => {
  originalEnv = process.env.CODA_API_TOKEN;
  delete process.env.CODA_API_TOKEN;

  await mkdir(configDir, { recursive: true });
  await mkdir(legacyConfigDir, { recursive: true });

  const file = Bun.file(configPath);
  if (await file.exists()) {
    originalConfig = await file.text();
  } else {
    originalConfig = undefined;
  }

  const legacyFile = Bun.file(legacyConfigPath);
  if (await legacyFile.exists()) {
    originalLegacyConfig = await legacyFile.text();
  } else {
    originalLegacyConfig = undefined;
  }

  // Write a clean config for each test
  await Bun.write(configPath, "{}");
  await Bun.write(legacyConfigPath, "{}");
});

afterEach(async () => {
  // Restore env
  if (originalEnv !== undefined) {
    process.env.CODA_API_TOKEN = originalEnv;
  } else {
    delete process.env.CODA_API_TOKEN;
  }
  // Restore config
  if (originalConfig !== undefined) {
    await Bun.write(configPath, originalConfig);
  } else {
    await rm(configPath, { force: true });
  }

  if (originalLegacyConfig !== undefined) {
    await Bun.write(legacyConfigPath, originalLegacyConfig);
  } else {
    await rm(legacyConfigPath, { force: true });
  }
});

test("getToken returns undefined when no token set", async () => {
  const token = await getToken();
  expect(token).toBeUndefined();
});

test("saveToken and getToken round-trip", async () => {
  await saveToken("test-token-abc123");
  const token = await getToken();
  expect(token).toBe("test-token-abc123");
});

test("removeToken clears stored token", async () => {
  await saveToken("test-token-xyz");
  await removeToken();
  const token = await getToken();
  expect(token).toBeUndefined();
});

test("CODA_API_TOKEN env var takes priority over config", async () => {
  await saveToken("config-token");
  process.env.CODA_API_TOKEN = "env-token";
  const token = await getToken();
  expect(token).toBe("env-token");
});

test("getToken falls back to config when env var is absent", async () => {
  await saveToken("config-only-token");
  delete process.env.CODA_API_TOKEN;
  const token = await getToken();
  expect(token).toBe("config-only-token");
});

test("getToken falls back to the legacy config path", async () => {
  await rm(configPath, { force: true });
  await Bun.write(legacyConfigPath, JSON.stringify({ token: "legacy-token" }));

  const token = await getToken();

  expect(token).toBe("legacy-token");
});
