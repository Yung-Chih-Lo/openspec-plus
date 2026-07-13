import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { join } from "node:path";

import { discoverCommandProfile } from "../.codex/skills/opsxp-setup/scripts/discover-command-profile.mjs";

const fixtures = join(import.meta.dirname, "fixtures", "command-discovery");
const commandIds = (profile) => profile.commands.verify.map(({ id }) => id);

test("FastAPI discovery requires independent pytest evidence", () => {
  const profile = discoverCommandProfile(join(fixtures, "fastapi"));

  assert.deepEqual(profile.stack, ["fastapi-python"]);
  assert.deepEqual(commandIds(profile), ["backend-lint", "backend-tests"]);
  assert.deepEqual(profile.commands.verify[0], {
    id: "backend-lint",
    run: "uv run ruff check .",
    cwd: ".",
    covers: ["lint"],
  });
  assert.deepEqual(profile.commands.verify[1], {
    id: "backend-tests",
    run: "uv run pytest -q",
    cwd: ".",
    covers: ["test_full"],
  });
});

test("FastAPI discovery does not infer pytest from a tests directory", () => {
  const profile = discoverCommandProfile(join(fixtures, "fastapi-no-pytest"));

  assert.deepEqual(profile.stack, ["fastapi-python"]);
  assert.deepEqual(profile.commands.verify, []);
  assert.match(profile.gaps.join("\n"), /No release command is proven/);
});

test("Vite discovery uses only declared package scripts", () => {
  const profile = discoverCommandProfile(join(fixtures, "vite"));

  assert.deepEqual(profile.stack, ["react-vite"]);
  assert.deepEqual(commandIds(profile), [
    "frontend-lint",
    "frontend-typecheck",
    "frontend-tests",
    "frontend-build",
  ]);
  assert.equal(profile.commands.verify.some(({ covers }) => covers.includes("e2e")), false);
  assert.equal(profile.gaps.length, 0);
});

test("Next.js discovery does not invent unit or E2E tests", () => {
  const profile = discoverCommandProfile(join(fixtures, "nextjs"));

  assert.deepEqual(profile.stack, ["nextjs"]);
  assert.deepEqual(commandIds(profile), [
    "frontend-lint",
    "frontend-typecheck",
    "frontend-build",
  ]);
  assert.equal(
    profile.commands.verify.some(({ covers }) =>
      covers.some((cover) => cover === "test_full" || cover === "e2e"),
    ),
    false,
  );
  assert.match(profile.gaps.join("\n"), /test is a placeholder/);
});

test("CI-proven Makefile aggregate replaces monorepo leaf commands", () => {
  const profile = discoverCommandProfile(join(fixtures, "monorepo"));

  assert.deepEqual(profile.stack, ["fastapi-python", "react-vite"]);
  assert.deepEqual(profile.command_discovery.roots, [
    ".",
    "apps/api",
    "apps/web",
  ]);
  assert.deepEqual(profile.commands.verify, [
    {
      id: "root-verify",
      run: "make verify",
      cwd: ".",
      covers: ["test_full", "build"],
    },
  ]);
  assert.deepEqual(profile.verification.required_commands, ["root-verify"]);
});

test("command discovery helper has a stable JSON CLI", () => {
  const script = join(
    import.meta.dirname,
    "..",
    ".codex",
    "skills",
    "opsxp-setup",
    "scripts",
    "discover-command-profile.mjs",
  );
  const result = spawnSync(
    process.execPath,
    [script, "--root", join(fixtures, "nextjs")],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).stack[0], "nextjs");
});
