# Review Panel Skill

Use this when closing a stage or when scoped verification touches behavior, boundaries, or shared machinery. One review taxonomy: lens-based, risk-routed. Adversarial/constructive reviewer pairs are presentation styles that must still report against these lenses.

## Required Flow

1. `node scripts/ai-loop/scope.mjs --base <base-ref>` names the required lenses for the diff (from the config `lenses` path patterns).
2. Spawn only the required reviewer lenses, at medium effort. Reserve highest effort for the main orchestrator when the architecture is genuinely hard.
3. Give reviewers the changed files or diff, not raw session history.
4. Verify each blocking claim before accepting it.
5. Record one line per lens in the stage's progress row: who/what reviewed it and what was found or fixed.

## Lenses

- `correctness`: always required. Behavior, tests, edge cases, false confidence.
- `security`: required when the diff touches auth, boundary bridges, storage, secrets, logging, filesystem, network egress, or privileged-process boundaries (config `lenses.security` globs).
- `product`: required for UI, user-facing behavior, or prompts (config `lenses.product` globs).
- `complexity`: required for shared machinery, dependencies, config, or broad diffs (config `lenses.complexity` globs).

## Receiving Review

Reviewer output is not automatically truth.

- Verify each claim against the code before implementing it. Critical and Important findings block only when verified and scoped.
- Minor findings go to the backlog section of `docs/wiki/progress.md`.
- Correct-but-out-of-stage findings go to backlog, not implementation.
- If a reviewer is unavailable or timed out, the evidence says unavailable; it does not count as reviewed.
- Push back on reviewer suggestions that are wrong, speculative, or outside the active stage.
