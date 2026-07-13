# Command Discovery

Use current files, not framework assumptions, to build the smallest non-duplicated command profile.

## Priority

1. Prefer a documented Makefile target or workspace script that CI also uses.
2. Otherwise use exact `package.json` scripts or Python tooling proven by `pyproject.toml`, lockfiles, dependencies, and test paths.
3. Infer the package manager from `packageManager` or lockfiles. Do not default to npm when another lockfile exists.
4. Keep one entry per package with its real `cwd`. Populate `monorepo_roots` for non-root packages.
5. Never configure an aggregate command and the leaf commands it already runs.

Each Verify entry has this shape:

```yaml
- id: backend-tests
  run: "python -m pytest -q"
  cwd: backend
  covers: [test_full]
```

Use stable lowercase IDs. `covers` may contain `lint`, `typecheck`, `test_full`, `build`, `e2e`, `security`, `smoke`, or another concrete proof class.

## FastAPI and Python

- Detect FastAPI from project dependencies; detect pytest separately from dependencies, config, test directories, Makefile, or CI.
- Prefer an existing target such as `make test-backend`. Otherwise select the runner proven by the project: `uv run pytest -q`, `poetry run pytest -q`, a documented virtualenv command, or `python -m pytest -q`.
- Add Ruff, Mypy, Pyright, packaging, Docker, security, or migration checks only when configured or used by CI.
- Do not invent a Python build command for an application that has no package or image build gate.

## React with Vite

- Use the exact `test`, `lint`, `typecheck`, and `build` scripts that exist.
- A typical proven profile is frontend test when present, then lint, typecheck, and build.
- Do not create `npm test` merely because Vitest is installed transitively or Vite is present.

## Next.js and shadcn

- Use exact package scripts. Test runners may be Vitest, Jest, Node test, or absent.
- Treat `lint`, `typecheck`, and `build` as separate gates when scripts exist, unless one documented aggregate already covers them.
- shadcn changes UI composition only; it proves neither unit-test nor E2E availability.

## E2E and live proof

- Add E2E only when a script, Playwright/Cypress config, Makefile target, CI job, or repo instruction proves the command.
- When configured, include its ID in `verification.required_commands` unless the user explicitly classifies it as non-gating.
- Browser smoke, API smoke, and live model replay are separate proof classes. Add only the risk-relevant command actually supported by the project.
