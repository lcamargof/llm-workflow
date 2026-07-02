import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const kitRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const lintScript = join(kitRoot, "scripts/wiki-lint.mjs");

function page(frontmatter, body = "") {
  const lines = Object.entries(frontmatter)
    .map(([key, value]) => (Array.isArray(value) ? `${key}:\n${value.map((item) => `  - ${item}`).join("\n")}` : `${key}: ${value}`))
    .join("\n");
  return `---\n${lines}\n---\n\n${body}\n`;
}

function fixtureRepo(pages) {
  const dir = mkdtempSync(join(tmpdir(), "llm-workflow-wiki-"));
  execFileSync("git", ["init", "-q", dir]);
  mkdirSync(join(dir, "docs/wiki/domains"), { recursive: true });
  for (const [name, content] of Object.entries(pages)) {
    writeFileSync(join(dir, "docs/wiki", name), content);
  }
  return dir;
}

function lint(dir) {
  try {
    return { code: 0, out: execFileSync("node", [lintScript], { cwd: dir, encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
}

const VALID = {
  "index.md": page({ title: "Index", updated: "2026-07-01", type: "ledger" }, "- [[project]]\n- [[log]]"),
  "project.md": page({ title: "Project", updated: "2026-07-01", type: "context" }, "See [[log]]."),
  "log.md": page({ title: "Log", updated: "2026-07-01", type: "log" }, "## 2026-07-01\n- init"),
};

test("valid wiki is green", () => {
  const dir = fixtureRepo(VALID);
  try {
    const result = lint(dir);
    assert.equal(result.code, 0, result.out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("broken link, orphan page, and missing frontmatter fail", () => {
  const dir = fixtureRepo({
    ...VALID,
    "project.md": page({ title: "Project", updated: "2026-07-01", type: "context" }, "See [[ghost]]."),
    "orphan.md": page({ title: "Orphan", updated: "2026-07-01", type: "context" }),
    "raw.md": "no frontmatter at all\n",
  });
  try {
    const result = lint(dir);
    assert.equal(result.code, 1);
    assert.match(result.out, /broken link \[\[ghost\]\]/);
    assert.match(result.out, /orphan\.md: not listed in index/);
    assert.match(result.out, /raw\.md: missing frontmatter/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("absolute local paths and bad dates fail", () => {
  const dir = fixtureRepo({
    ...VALID,
    "log.md": page({ title: "Log", updated: "yesterday", type: "log" }, "built at /Users/someone/project"),
  });
  try {
    const result = lint(dir);
    assert.equal(result.code, 1);
    assert.match(result.out, /updated must be YYYY-MM-DD/);
    assert.match(result.out, /absolute local machine path/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("domain page without sources fails", () => {
  const dir = fixtureRepo({
    ...VALID,
    "index.md": page({ title: "Index", updated: "2026-07-01", type: "ledger" }, "- [[project]]\n- [[log]]\n- [[storage]]"),
    "domains/storage.md": page({ title: "Storage", updated: "2026-07-01", type: "domain" }, "About storage."),
  });
  try {
    const result = lint(dir);
    assert.equal(result.code, 1);
    assert.match(result.out, /domain page needs sources globs/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
