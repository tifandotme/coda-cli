import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { printOutput } from "./output.ts";

let logs: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  logs = [];
  console.log = (...args: unknown[]) => logs.push(args.join(" "));
});

afterEach(() => {
  console.log = originalLog;
});

test("JSON format outputs JSON", () => {
  printOutput({ foo: "bar" }, "json");
  expect(logs[0]).toBe(JSON.stringify({ foo: "bar" }, null, 2));
});

test("table format with array", () => {
  printOutput([{ id: "1", name: "Doc A" }, { id: "2", name: "Doc B" }], "table");
  // Should have header, divider, and 2 rows
  expect(logs.length).toBe(4);
  expect(logs[0]).toContain("id");
  expect(logs[0]).toContain("name");
});

test("table format with empty array", () => {
  printOutput([], "table");
  expect(logs[0]).toContain("no results");
});

test("table format with single object shows key-value pairs", () => {
  printOutput({ id: "abc", title: "My Doc" }, "table");
  const output = logs.join("\n");
  expect(output).toContain("id");
  expect(output).toContain("abc");
  expect(output).toContain("title");
  expect(output).toContain("My Doc");
});
