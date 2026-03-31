import { test, expect } from "bun:test";
import { paginate, fetchAll } from "./paginator.ts";

test("paginate yields all pages", async () => {
  const pages = [
    { items: [1, 2], nextPageToken: "p2" },
    { items: [3, 4], nextPageToken: "p3" },
    { items: [5], nextPageToken: undefined },
  ];
  let call = 0;
  const fetchPage = async (pageToken?: string) => pages[call++]!;

  const results: number[][] = [];
  for await (const page of paginate<number>(fetchPage)) {
    results.push(page);
  }

  expect(results).toEqual([[1, 2], [3, 4], [5]]);
  expect(call).toBe(3);
});

test("fetchAll flattens all pages", async () => {
  const pages = [
    { items: ["a", "b"], nextPageToken: "t2" },
    { items: ["c"], nextPageToken: undefined },
  ];
  let call = 0;
  const fetchPage = async () => pages[call++]!;

  const all = await fetchAll<string>(fetchPage);
  expect(all).toEqual(["a", "b", "c"]);
});

test("paginate handles single page with no nextPageToken", async () => {
  const fetchPage = async () => ({ items: [42], nextPageToken: undefined });
  const all = await fetchAll<number>(fetchPage);
  expect(all).toEqual([42]);
});
