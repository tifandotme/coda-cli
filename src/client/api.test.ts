import { test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { CodaClient } from "./api.ts";
import { CodaApiError } from "../utils/errors.ts";

// Helper to create a mock fetch response
function mockResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

let originalFetch: typeof globalThis.fetch;

type MockFetch = typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("get sends correct Authorization header", async () => {
  const calls: Request[] = [];
  globalThis.fetch = (async (input: Request | string | URL, init?: RequestInit) => {
    calls.push(new Request(input as string, init));
    return mockResponse(200, { id: "abc", name: "Test Doc" });
  }) as MockFetch;

  const client = new CodaClient("my-token");
  await client.get("/docs/abc");

  expect(calls.length).toBe(1);
  expect(calls[0]!.headers.get("Authorization")).toBe("Bearer my-token");
});

test("get appends query params", async () => {
  let capturedUrl = "";
  globalThis.fetch = (async (input: Request | string | URL) => {
    capturedUrl = input.toString();
    return mockResponse(200, { items: [] });
  }) as MockFetch;

  const client = new CodaClient("tok");
  await client.get("/docs", { limit: 10, query: "hello" });

  expect(capturedUrl).toContain("limit=10");
  expect(capturedUrl).toContain("query=hello");
});

test("get omits undefined query params", async () => {
  let capturedUrl = "";
  globalThis.fetch = (async (input: Request | string | URL) => {
    capturedUrl = input.toString();
    return mockResponse(200, { items: [] });
  }) as MockFetch;

  const client = new CodaClient("tok");
  await client.get("/docs", { limit: 10, query: undefined });

  expect(capturedUrl).toContain("limit=10");
  expect(capturedUrl).not.toContain("query");
});

test("throws CodaApiError on non-OK response", async () => {
  globalThis.fetch = (async () => mockResponse(404, { message: "Doc not found" })) as unknown as MockFetch;

  const client = new CodaClient("tok");
  let thrown: unknown;
  try {
    await client.get("/docs/missing");
  } catch (err) {
    thrown = err;
  }

  expect(thrown).toBeInstanceOf(CodaApiError);
  expect((thrown as CodaApiError).statusCode).toBe(404);
  expect((thrown as CodaApiError).message).toBe("Doc not found");
});

test("retries on 429 up to MAX_RETRIES times", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    if (calls <= 3) {
      return mockResponse(429, { message: "rate limited" }, { "Retry-After": "0" });
    }
    return mockResponse(200, { id: "ok" });
  }) as unknown as MockFetch;

  const client = new CodaClient("tok");
  const result = await client.get<{ id: string }>("/docs/abc");
  expect(result.id).toBe("ok");
  expect(calls).toBe(4); // 3 retries + 1 success
});

test("throws CodaApiError after exhausting retries on 429", async () => {
  globalThis.fetch = (async () =>
    mockResponse(429, { message: "too many requests" }, { "Retry-After": "0" })) as unknown as MockFetch;

  const client = new CodaClient("tok");
  let thrown: unknown;
  try {
    await client.get("/docs/abc");
  } catch (err) {
    thrown = err;
  }

  expect(thrown).toBeInstanceOf(CodaApiError);
  expect((thrown as CodaApiError).statusCode).toBe(429);
});

test("post sends JSON body", async () => {
  let capturedBody = "";
  globalThis.fetch = (async (_input: Request | string | URL, init?: RequestInit) => {
    capturedBody = init?.body as string;
    return mockResponse(200, { id: "new-doc" });
  }) as MockFetch;

  const client = new CodaClient("tok");
  await client.post("/docs", { title: "My Doc" });

  expect(JSON.parse(capturedBody)).toEqual({ title: "My Doc" });
});

test("returns undefined for 204 No Content", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 204 })) as unknown as MockFetch;

  const client = new CodaClient("tok");
  const result = await client.delete("/docs/abc");
  expect(result).toBeUndefined();
});
