import { expect, test } from "bun:test";
import { apiPathFromHref, buildApiPath, normalizeDocId } from "./coda-paths.ts";

test("normalizeDocId extracts the API doc id from a browser URL", () => {
  expect(normalizeDocId("https://coda.io/d/Technical-Docs_dkDhxkvpaea/Template-Project-Feature-Name_su6nl4oj")).toBe(
    "kDhxkvpaea"
  );
  expect(normalizeDocId("https://coda.io/d/_dkDhxkvpaea")).toBe("kDhxkvpaea");
  expect(normalizeDocId("kDhxkvpaea")).toBe("kDhxkvpaea");
});

test("buildApiPath encodes user-provided path segments", () => {
  expect(
    buildApiPath("docs", "kDhxkvpaea", "pages", "[Template: Project / Feature Name]")
  ).toBe("/docs/kDhxkvpaea/pages/%5BTemplate%3A%20Project%20%2F%20Feature%20Name%5D");
});

test("apiPathFromHref strips the Coda API host", () => {
  expect(
    apiPathFromHref(
      "https://coda.io/apis/v1/docs/kDhxkvpaea/pages/canvas-OELZ6nl4oj/export/abc-123?foo=bar"
    )
  ).toBe("/docs/kDhxkvpaea/pages/canvas-OELZ6nl4oj/export/abc-123?foo=bar");
});
