import assert from "node:assert/strict";
import { test } from "node:test";

import { globToRegExp, matchesAny } from "../scripts/lib/core.mjs";

test("glob: ** crosses segments", () => {
  assert.ok(globToRegExp("src/**").test("src/a/b/c.ts"));
  assert.ok(globToRegExp("src/**").test("src/a.ts"));
  assert.ok(!globToRegExp("src/**").test("tests/a.ts"));
});

test("glob: **/ prefix matches root-level files too", () => {
  assert.ok(globToRegExp("**/*.ts").test("a.ts"));
  assert.ok(globToRegExp("**/*.ts").test("deep/nested/a.ts"));
  assert.ok(!globToRegExp("**/*.ts").test("a.tsx"));
});

test("glob: * stays within a segment", () => {
  assert.ok(globToRegExp("src/*.ts").test("src/a.ts"));
  assert.ok(!globToRegExp("src/*.ts").test("src/nested/a.ts"));
});

test("glob: {a,b} alternation", () => {
  const regex = globToRegExp("**/*.{ts,tsx}");
  assert.ok(regex.test("src/a.ts"));
  assert.ok(regex.test("src/a.tsx"));
  assert.ok(!regex.test("src/a.css"));
});

test("glob: literal dots are escaped", () => {
  assert.ok(!globToRegExp("*.ts").test("ats")); // "." must not act as regex any-char
});

test("matchesAny unions globs", () => {
  assert.ok(matchesAny("package.json", ["src/**", "package.json"]));
  assert.ok(!matchesAny("README.md", ["src/**", "package.json"]));
});
