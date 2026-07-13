import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const fixture = join(import.meta.dirname, "fixtures", "openspec-cli", "openspec");

function runOpenSpec(cwd, args) {
  const result = spawnSync("openspec", ["--no-color", ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `openspec ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`,
  );
  return `${result.stdout}${result.stderr}`;
}

test("OpenSpec 1.6.0 validates and archives the compatibility fixture", () => {
  const version = spawnSync("openspec", ["--version"], { encoding: "utf8" });
  assert.equal(version.status, 0, "Install @fission-ai/openspec@1.6.0 first");
  assert.equal(version.stdout.trim(), "1.6.0");

  const workspace = mkdtempSync(join(tmpdir(), "opsxp-openspec-smoke-"));
  try {
    cpSync(fixture, join(workspace, "openspec"), { recursive: true });

    runOpenSpec(workspace, [
      "validate",
      "smoke-change",
      "--strict",
      "--no-interactive",
    ]);
    runOpenSpec(workspace, ["archive", "-y", "smoke-change"]);
    runOpenSpec(workspace, ["validate", "--all", "--strict", "--no-interactive"]);

    const canonicalSpec = join(
      workspace,
      "openspec",
      "specs",
      "smoke-capability",
      "spec.md",
    );
    assert.equal(existsSync(canonicalSpec), true);
    assert.match(readFileSync(canonicalSpec, "utf8"), /Smoke capability/);
    assert.equal(
      existsSync(join(workspace, "openspec", "changes", "smoke-change")),
      false,
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
