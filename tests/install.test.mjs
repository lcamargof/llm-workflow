import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const kitRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function freshTarget() {
  const dir = mkdtempSync(join(tmpdir(), "llm-workflow-test-"));
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
      "scripts/llm-workflow/scope.mjs",
      "scripts/llm-workflow/lib/core.mjs",
      "AGENTS.md",
      "CLAUDE.md",
      "llm-workflow.config.json",
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

test("fresh install with existing agent context points at adopt.md", () => {
  const target = freshTarget();
  try {
    writeFileSync(join(target, "CLAUDE.md"), "# Existing rules");
    writeFileSync(join(target, ".cursorrules"), "old rules");
    const output = install(target);
    assert.ok(output.includes("skills/adopt.md"), "missing adopt.md pointer");
    assert.ok(output.includes("CLAUDE.md"), "detected files not named");
    assert.ok(output.includes(".cursorrules"), "detected files not named");
    // Pre-existing context is never overwritten by scaffolding.
    assert.equal(readFileSync(join(target, "CLAUDE.md"), "utf8"), "# Existing rules");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("fresh install into a clean repo does not mention adoption", () => {
  const target = freshTarget();
  try {
    const output = install(target);
    assert.ok(!output.includes("adopt.md"), "clean install should not route to adopt.md");
    assert.ok(output.includes("next: edit llm-workflow.config.json"), "missing fresh-install next step");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("update replaces kit files but never project files", () => {
  const target = freshTarget();
  try {
    install(target);
    writeFileSync(join(target, "llm-workflow.config.json"), JSON.stringify({ kitVersion: 0, gate: ["true"], verify: [] }, null, 2));
    writeFileSync(join(target, "docs/wiki/project.md"), "MINE");
    writeFileSync(join(target, "skills/workflow.md"), "STALE KIT FILE");
    install(target, "--update");
    assert.equal(readFileSync(join(target, "docs/wiki/project.md"), "utf8"), "MINE");
    assert.ok(readFileSync(join(target, "skills/workflow.md"), "utf8").includes("# Workflow Skill"));
    assert.equal(JSON.parse(readFileSync(join(target, "llm-workflow.config.json"), "utf8")).kitVersion, 1);
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
