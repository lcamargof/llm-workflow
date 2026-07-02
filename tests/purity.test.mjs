// The kit must stay project-agnostic: no references to the product it was extracted from.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const kitRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANNED = [/interview[- ]?friend/i, /\binterviewer\b/i, /\bavatar\b/i, /\bexercise\b/i, /\bcodex\b/i, /\bopencode\b/i];
const SURFACES = ["skills", "scripts", "templates", "install.mjs", "README.md"];

test("kit files contain no product-specific references", () => {
  const offenders = [];
  for (const surface of SURFACES) {
    for (const file of walk(join(kitRoot, surface))) {
      const content = readFileSync(file, "utf8");
      for (const pattern of BANNED) {
        if (pattern.test(content)) offenders.push(`${file}: ${pattern}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

function walk(path) {
  try {
    const entries = readdirSync(path, { withFileTypes: true });
    return entries.flatMap((entry) =>
      entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)],
    );
  } catch {
    return [path]; // a file, not a directory
  }
}
