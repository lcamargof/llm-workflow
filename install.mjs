// Install or update the ai-loop kit in a target repo.
// Usage: node install.mjs <target-repo> [--update]
//
// Ownership contract:
//   kit-owned, replaced wholesale on --update:  <target>/skills/, <target>/scripts/ai-loop/
//   project-owned, scaffolded once, never touched again: AGENTS.md, CLAUDE.md,
//   ai-loop.config.json, docs/wiki/
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const KIT_VERSION = 1;
const kitRoot = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
const isUpdate = args.includes("--update");
if (!target || !existsSync(target)) {
  console.error("usage: node install.mjs <target-repo> [--update]");
  process.exit(2);
}
if (resolve(target) === kitRoot) {
  console.error("refusing to install the kit into itself");
  process.exit(2);
}
if (!existsSync(join(target, ".git"))) {
  console.error(`warning: ${target} is not a git repository — the loop's gates assume git`);
}

// --- kit-owned directories (wholesale) ---
replaceOwnedDir(join(kitRoot, "skills"), join(target, "skills"));
replaceOwnedDir(join(kitRoot, "scripts"), join(target, "scripts/ai-loop"));

// --- project-owned scaffolding (fresh install only; skip anything that exists) ---
const today = new Date().toISOString().slice(0, 10);
scaffold("templates/AGENTS.md", "AGENTS.md");
scaffold("templates/CLAUDE.md", "CLAUDE.md");
scaffold("templates/ai-loop.config.json", "ai-loop.config.json");
if (!existsSync(join(target, "docs/wiki"))) {
  mkdirSync(join(target, "docs/wiki/domains"), { recursive: true });
  for (const entry of readdirSync(join(kitRoot, "templates/wiki"))) {
    scaffold(`templates/wiki/${entry}`, `docs/wiki/${entry}`);
  }
} else if (!isUpdate) {
  console.log("skip: docs/wiki already exists");
}

if (isUpdate) {
  const configPath = join(target, "ai-loop.config.json");
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    if (config.kitVersion !== KIT_VERSION) {
      config.kitVersion = KIT_VERSION;
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
      console.log(`config kitVersion → ${KIT_VERSION}`);
    }
  }
}

console.log(`ai-loop v${KIT_VERSION} ${isUpdate ? "updated in" : "installed into"} ${target}`);
if (!isUpdate) {
  console.log(
    "next: edit ai-loop.config.json (gate + verify rules for this repo), then fill docs/wiki/project.md",
  );
}

function replaceOwnedDir(source, destination) {
  if (existsSync(destination)) {
    // Refuse to delete files the kit does not own — project skills belong outside kit dirs.
    const kitFiles = new Set(listFiles(source));
    const strangers = listFiles(destination).filter((file) => !kitFiles.has(file));
    if (strangers.length > 0 && !isUpdate) {
      console.error(
        `refusing to replace ${destination}: non-kit files present: ${strangers.join(", ")}`,
      );
      console.error("move them elsewhere or rerun with --update after confirming ownership");
      process.exit(1);
    }
    if (strangers.length > 0)
      console.log(`note: preserving non-kit files in ${destination}: ${strangers.join(", ")}`);
    for (const file of kitFiles) rmSync(join(destination, file), { force: true });
  }
  cpSync(source, destination, { recursive: true });
  console.log(`kit dir: ${destination}`);
}

function listFiles(dir, prefix = "") {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(join(dir, entry.name), path));
    else files.push(path);
  }
  return files;
}

function scaffold(sourceRelative, targetRelative) {
  const destination = join(target, targetRelative);
  if (existsSync(destination)) {
    // Directories scaffolded earlier in this run (e.g. docs/wiki/domains) are expected hits.
    if (!isUpdate && !statSyncIsDir(destination))
      console.log(`skip: ${targetRelative} already exists`);
    return;
  }
  mkdirSync(dirname(destination), { recursive: true });
  const content = readFileSync(join(kitRoot, sourceRelative), "utf8").replaceAll("{{DATE}}", today);
  writeFileSync(destination, content);
  console.log(`scaffold: ${targetRelative}`);
}

function statSyncIsDir(path) {
  return statSync(path).isDirectory();
}
