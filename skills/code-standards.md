# Code Standards Skill

Use this when writing or reviewing application code. These are cross-project defaults; a project overrides them only via an explicit note in `docs/wiki/project.md`.

## Root Rule

The dumb solution wins. Code an agent or a human can rewrite in a week beats code that needs a diagram. If it can't be explained in 30 seconds, it's too complex. Three similar lines beat a premature abstraction. Optimize in this order: stability, simplicity, performance.

## Shape

- Domain-gated feature folders: each feature owns its local types, tests, fixtures, and boundaries.
- Share across domains through typed interfaces, not ambient globals or cross-feature imports.
- Keep logic inline until an extraction names a real concept, hides a complex boundary, or is reused.
- No barrel files that force unrelated modules to load.
- Components under ~150 lines; extract logic into hooks, keep components dumb.
- Early returns over nested conditionals and `else`.
- Prefer `const`; avoid reassignment unless it materially simplifies control flow.
- Helpers live below the exported function they support when that keeps the happy path readable.

## Types

- No broad `any`. `unknown` plus schema/type guards at boundaries.
- Validate at trust boundaries (IPC, network, storage, user input); trust internal calls.
- Money and on-chain amounts are BigInt, never Number.

## Naming & Files

- Files: kebab-case (`use-auction-status.ts`, `auction-card.tsx`).
- Functions camelCase, constants UPPER_SNAKE_CASE, booleans prefixed is/has/can/should.
- Verbose names over abbreviations.

## State (jotai projects)

- Small focused atoms, one responsibility each.
- Derived atoms for computed values — never useEffect sync.
- Action atoms for coordinated updates.
- `useAtomValue` by default, `useSetAtom` for writes, `useAtom` only when both are needed.

## Comments

- A comment states a constraint the code cannot show: a WHY, a security boundary, an upstream compatibility note, a deliberate shortcut with its ceiling and upgrade trigger.
- Never narrate what the next line does, where code came from, or why a change is correct.

## Tests

- Tests live in dedicated `tests/` folders, not alongside source.
- Behavior, not implementation. Would this catch a real bug? If not, delete it.
- Good targets: critical business logic, trust boundaries, failure modes, edge cases that have broken before, complex async flows.
- Tests are typechecked like source. Failing tests get root-caused, never skipped.
- Tests are deletable when requirements change — they are feedback loops, not coverage metrics.

## What Not To Do

Abstractions for one-time use. Features nobody asked for. Clever one-liners that sacrifice readability. Error handling for impossible scenarios. Optimizing before it's slow. Custom config where the framework default works.
