# AGENTS.md — Code Quality Standards

## Purpose

- Keep the codebase maintainable, reliable, and easy to evolve.
- Optimize for clarity first, then performance and flexibility.

## Formatting

- Use 4-space indentation in all files (matches project Prettier config: `tabWidth: 4`).

## Core Quality Principles

- Prefer simple solutions over clever ones.
- Make behavior explicit; avoid hidden coupling between modules.
- Keep changes small, scoped, and reversible.
- Leave touched code cleaner than it was before.

## Source Tree Organization

- Group by feature/domain first, then by technical type inside that feature.
- Keep shared code clearly separated from feature-local code.
- Place entry/bootstrap logic in `src/components/app/`.
- Put static assets in dedicated asset directories (`styles`, vendor CSS).
- Shared UI splits by kind: `shared/primitives`, `shared/navigation`,
  `shared/page`, `shared/typography`, `shared/widgets`. Core splits by role:
  `format`, `a11y`, `config`, `content`, `map`.
- Feature widgets used by more than one page live under `components/build` and
  `components/network`, not under a single page.
- Folders under `src/` need at least two entries (structure gate); do not
  introduce single-file directories. Cap is 7 entries before a warning.

```
src/
  index.tsx
  assets/          styles + vendor CSS
  components/
    app/           bootstrap
    layout/        site chrome
    pages/         routes; coverage/ and problems/ keep page-local widgets
    shared/        primitives by kind
    build/         widgets used by Home and Build
    network/       widgets used by Home and Map
  core/
    a11y/
    config/        SITE, APP_ROUTES
    content/       mirrors pages; `as const satisfies` shapes in types.ts
    format/
    map/
```

## Markup Rules

These rules are enforced by ESLint (`no-restricted-syntax` plus `jsx-a11y`).

- Host elements are **default-deny**. The allowlist is exactly `div`, `span`,
  `nav`, `main`, `header`, `footer`, `section`, `article`; every other lowercase
  element is a lint error. Adding one means editing `ALLOWED_ELEMENTS` in
  `config/lint/eslint.config.mjs` and justifying it here.
- All visual appearance comes from CSS classes (`snake_case`).
- Client navigation uses `NavHit` (no `href` on host elements).
- Leaving the site is the one exception. `ExternalLink` renders a real `<a href>`
  with `rel='noopener noreferrer'`.
- Because nothing is a native control, every clickable element must carry a
  literal `role`, `tabIndex={0}`, and an `onKeyDown` honouring Enter and Space
  (`activationKeyDown` in `src/core/a11y/interactive.ts`). Prefer `Pressable`.

## CSS Standards

- Keep style architecture layered, in this order — the import order in
  `src/assets/styles/index.css` is the cascade order:

    | Layer        | Holds                                                |
    | ------------ | ---------------------------------------------------- |
    | `tokens`     | Raw values, split by kind. Emits no selectors.       |
    | `base`       | Element defaults.                                    |
    | `components` | Reusable pieces, one sheet per shared widget family. |
    | `layout`     | The site frame: shell, header, wordmark, footer.     |
    | `sections`   | Page bodies.                                         |
    | `utilities`  | Single-purpose classes composed onto the above.      |

- Use `snake_case` class names only, for files as well as classes.
- Do not use `__` or `--` in class names.
- Every raw value comes from a token in `src/assets/styles/tokens/`.

## Content

- Everything under `src/core/content` mirrors `src/components/pages`: a page and
  the copy it reads sit at the same path. A page imports its own module and no
  other page's copy.
- Every content export closes with `as const satisfies <shape>`, with the shape
  declared in `src/core/content/types.ts`. Enforced by
  `content/require-satisfies` in the ESLint config.
- `types.ts` exports only the shapes another module names.

## Lint Severity

- There is no `warn`. A rule either blocks the build or is switched off
  explicitly, next to a comment saying why.

## Mandatory Quality Gates

- Run `npm run check` before commit for all code/config/style changes. It runs
  type checks, lint, tests, and the build.
- During iteration, minimum local gate is `npm run check:types`, `npm run lint`
  and `npm test`.
- If a gate fails, fix the issue and rerun before continuing.

## TypeScript Standards

- Use strict, explicit types for public APIs, props, return values, and shared utilities.
- Avoid `any`; use `unknown` + narrowing when exact type is not known.
- Prefer `readonly` data shapes and immutable updates where practical.
- Remove dead code, unused exports, and unused imports immediately. Knip
  (`lint:deadcode`) fails the build on them.
- Derive types from data rather than restating them. `APP_ROUTES` is the single
  source of truth for the site map.

## React Standards

- Keep components and hooks pure; no side effects during render.
- Follow Hooks rules strictly.
- Use `useEffect` only for real side effects.
- Prefer many small components over large page monoliths.
- UI rendering in components; logic in hooks/utilities.

## Testing

- Tests live in `tests/`, mirroring `src/` and `config/`. They stay out of the
  source tree so the structure check keeps measuring product code.
- Node is the default environment; component tests opt in with a
  `// @vitest-environment jsdom` docblock.

## Absolute Git Safety Rule

- Never run commands that discard local uncommitted changes (`git checkout --`, `git restore`, `git reset --hard`, `git clean -fd`).
- Never commit unless the user explicitly asks.

## Definition of Done

- Type checks pass.
- Lint checks pass.
- Tests pass.
- Build passes.
- No dead code, no temporary workarounds, no unexplained rule suppressions.
