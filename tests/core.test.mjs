import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { globToRegExp, matchesAny, scanRedFlags } from "../scripts/lib/core.mjs";

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

test("glob: * inside {} alternatives works and never throws", () => {
  const regex = globToRegExp("{*.ts,*.tsx}");
  assert.ok(regex.test("a.ts"));
  assert.ok(regex.test("b.tsx"));
  assert.ok(!regex.test("a.css"));
  assert.ok(!globToRegExp("src/{util*,lib}/x.ts").test("src/uti/x.ts"));
  assert.ok(globToRegExp("src/{util*,lib}/x.ts").test("src/utilities/x.ts"));
});

test("matchesAny unions globs", () => {
  assert.ok(matchesAny("package.json", ["src/**", "package.json"]));
  assert.ok(!matchesAny("README.md", ["src/**", "package.json"]));
});

test("scanRedFlags catches multi-line empty catch and reports its line", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-loop-flags-"));
  try {
    mkdirSync(join(root, "src"));
    writeFileSync(
      join(root, "src/a.ts"),
      ["const x = 1;", "try {", "  f();", "} catch (e) {", "}", "console.log(x);"].join("\n"),
    );
    const findings = scanRedFlags(["src/a.ts"], {}, root);
    const ids = findings.map((finding) => finding.id).sort();
    assert.deepEqual(ids, ["console-log", "empty-catch"]);
    assert.equal(findings.find((finding) => finding.id === "empty-catch").line, 4);
    assert.equal(findings.find((finding) => finding.id === "console-log").line, 6);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
