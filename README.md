# ai-loop

A portable, agent-agnostic AI-collaboration kit: the workflow loop, wiki-based project memory, review discipline, and code standards, extracted from a real project and dieted down to what agents actually follow under pressure.

## Philosophy

- **Behavioral skills are the value; scripts are minimal support.** Heavy gates get routed around — that's a measured result, not a theory. Every gate here is small enough to obey.
- **The dumb solution wins.** Zero dependencies, plain markdown, one JSON config.
- **Evidence over trust.** No completion claims without fresh verification; reviewer output is verified before it's believed; a skipped review is recorded as skipped, not passed.
- **The wiki compounds.** Project knowledge lives in `docs/wiki/` (Karpathy LLM-Wiki style: interlinked pages, ingest/query/lint). Agents maintain it at every closeout so future agents load less and assume less.

## Install

```bash
node install.mjs /path/to/repo          # fresh install
node install.mjs /path/to/repo --update # pull kit updates (project files untouched)
```

Fresh install scaffolds `AGENTS.md`, `CLAUDE.md`, `ai-loop.config.json`, and `docs/wiki/`, then you:

1. Edit `ai-loop.config.json`: the `gate` (full closeout commands) and `verify` rules (glob groups → commands) for this repo.
2. Fill `docs/wiki/project.md` (product, stack specifics, safety, UI register).

Ownership: the kit owns `skills/` and `scripts/ai-loop/` (replaced wholesale on `--update`). Everything else is yours and never touched after scaffolding.

## The loop

```
workflow-start --stage "<name>"     # clean tree + ledger row + base ref
  implement smallest slice
  scope.mjs --base <ref>            # touched files → verify commands + review lenses + red flags
  review through required lenses    # verify claims before accepting
closeout: full gate + visual check (UI) + progress row + wiki ingest + wiki-lint
```

## Layout

- `skills/` — workflow, review-panel, wiki, code-standards, self-improve, writing-great-skills, ui-ux, stack, design
- `scripts/` — `scope.mjs`, `workflow-start.mjs`, `wiki-lint.mjs`, `lib/core.mjs`
- `templates/` — AGENTS.md router, CLAUDE.md shim, config, wiki skeleton
- `tests/` — `node --test` (scope engine, wiki-lint, installer, kit purity)

## S-tier bar

The kit is done when, measured not vibed: adoption of a fresh repo is one install + one config edit (<10 min to first productive loop); a complex multi-file feature ships with zero gates routed around (ledger-drift alarm proves it); the wiki stays in sync unprompted (wiki-lint green incl. domain drift); kit self-tests and purity checks are green.
