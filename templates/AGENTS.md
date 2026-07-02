# Agent Router

Loader, not playbook. Reusable workflow rules live in `skills/` (kit-owned, updated via ai-loop); project knowledge lives in `docs/wiki/` (project-owned).

## Load Order

- For staged or code work, read `skills/workflow.md` first.
- Before writing or reviewing app code, read `skills/code-standards.md`.
- Before closing a stage, read `skills/review-panel.md` and `skills/wiki.md`.
- Before user-facing UI work, read `skills/ui-ux.md`.
- Before adding tooling or starting a project surface, read `skills/stack.md`.
- For project context (product, stack specifics, risks, UI register), read `docs/wiki/project.md`.
- When exploring project knowledge, start at `docs/wiki/index.md` and follow links.
- At the end of a major workload, read `skills/self-improve.md`.
- When editing skills or routing, read `skills/writing-great-skills.md`.

## Default Loop

- `node scripts/ai-loop/workflow-start.mjs --stage "<stage>"` for real stages; implement the smallest complete slice.
- Inner loop: `node scripts/ai-loop/scope.mjs --base <base-ref>` (verify commands + required review lenses + red flags for the touched files).
- Closeout: fresh full gate (config `gate`), visual check for UI stages, one progress row, wiki ingest, `node scripts/ai-loop/wiki-lint.mjs` green.

## Review Budget

- Review changed files or the diff, not the whole repo.
- Run only the risk-routed lenses `scope.mjs` names. No multi-persona fan-out by default.
- Verify reviewer claims before implementing them. Reject correct-but-out-of-stage suggestions to backlog.

## Stop Conditions

- Ask before destructive actions, credentials, new auth assumptions, or architecture changes that widen scope.
- Stop after three failed attempts on the same symptom and question the architecture.
- Do not claim completion without fresh verification from this turn.
