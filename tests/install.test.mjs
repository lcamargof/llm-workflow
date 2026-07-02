import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const kitRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function freshTarget() {
  const dir = mkdtempSync(join(tmpdir(), "ai-loop-test-"));
  mkdirSync(join(dir, ".git")); // enough to pass the git check
  return dir;
}

function install(target, ...flags) {
  return execFileSync("node", [join(kitRoot, "install.mjs"), target, ...flags], { encoding: "utf8" });
}

test("fresh install scaffolds everything", () => {
  const target = freshTarget();
  try {
    install(target);
    for (const path of [
      "skills/workflow.md",
      "scripts/ai-loop/scope.mjs",
      "scripts/ai-loop/lib/core.mjs",
      "AGENTS.md",
      "CLAUDE.md",
      "ai-loop.config.json",
      "docs/wiki/index.md",
      "docs/wiki/progress.md",
    ]) {
      assert.ok(existsSync(join(target, path)), `missing ${path}`);
    }
    const log = readFileSync(join(target, "docs/wiki/log.md"), "utf8");
    assert.ok(!log.includes("{{DATE}}"), "date placeholder not replaced");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("update replaces kit files but never project files", () => {
  const target = freshTarget();
  try {
    install(target);
    writeFileSync(join(target, "ai-loop.config.json"), JSON.stringify({ kitVersion: 0, gate: ["true"], verify: [] }, null, 2));
    writeFileSync(join(target, "docs/wiki/project.md"), "MINE");
    writeFileSync(join(target, "skills/workflow.md"), "STALE KIT FILE");
    install(target, "--update");
    assert.equal(readFileSync(join(target, "docs/wiki/project.md"), "utf8"), "MINE");
    assert.ok(readFileSync(join(target, "skills/workflow.md"), "utf8").includes("# Workflow Skill"));
    assert.equal(JSON.parse(readFileSync(join(target, "ai-loop.config.json"), "utf8")).kitVersion, 1);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("fresh install refuses to clobber non-kit files in kit dirs", () => {
  const target = freshTarget();
  try {
    mkdirSync(join(target, "skills"), { recursive: true });
    writeFileSync(join(target, "skills/my-own-skill.md"), "precious");
    assert.throws(() => install(target));
    assert.equal(readFileSync(join(target, "skills/my-own-skill.md"), "utf8"), "precious");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("update preserves non-kit files in kit dirs", () => {
  const target = freshTarget();
  try {
    install(target);
    writeFileSync(join(target, "skills/my-own-skill.md"), "precious");
    install(target, "--update");
    assert.equal(readFileSync(join(target, "skills/my-own-skill.md"), "utf8"), "precious");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
