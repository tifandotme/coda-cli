import { test, expect } from "bun:test";
import { CodaApiError, formatError } from "./errors.ts";

test("CodaApiError stores fields", () => {
  const err = new CodaApiError(404, "Not Found", "Doc not found");
  expect(err.statusCode).toBe(404);
  expect(err.statusMessage).toBe("Not Found");
  expect(err.message).toBe("Doc not found");
  expect(err.name).toBe("CodaApiError");
});

test("formatError JSON for CodaApiError", () => {
  const err = new CodaApiError(403, "Forbidden", "Access denied");
  const out = formatError(err, "json");
  const parsed = JSON.parse(out);
  expect(parsed.error).toBe(true);
  expect(parsed.statusCode).toBe(403);
  expect(typeof parsed.message).toBe("string");
});

test("formatError table for CodaApiError", () => {
  const err = new CodaApiError(403, "Forbidden", "Access denied");
  const out = formatError(err, "table");
  expect(out).toContain("403");
});

test("formatError JSON 401 includes login hint", () => {
  const err = new CodaApiError(401, "Unauthorized", "Bad token");
  const out = formatError(err, "json");
  const parsed = JSON.parse(out);
  expect(parsed.message).toContain("login");
});

test("formatError handles generic Error", () => {
  const err = new Error("network failure");
  const out = formatError(err, "json");
  const parsed = JSON.parse(out);
  expect(parsed.error).toBe(true);
  expect(parsed.message).toBe("network failure");
});
