#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PROOF_ORDER = [
  "lint",
  "typecheck",
  "test_full",
  "build",
  "e2e",
  "security",
  "smoke",
];

const SCRIPT_PROOFS = [
  { names: ["lint"], cover: "lint", suffix: "lint" },
  {
    names: ["typecheck", "type-check", "check:types"],
    cover: "typecheck",
    suffix: "typecheck",
  },
  { names: ["test"], cover: "test_full", suffix: "tests" },
  { names: ["build"], cover: "build", suffix: "build" },
  { names: ["e2e", "test:e2e"], cover: "e2e", suffix: "e2e" },
];

const PYPROJECT_PARSER = String.raw`
import json
import re
import sys
import tomllib

with open(sys.argv[1], "rb") as handle:
    data = tomllib.load(handle)

dependencies = []

def collect(value):
    if isinstance(value, str):
        dependencies.append(re.split(r"[<>=!~\[;\s]", value, maxsplit=1)[0])
    elif isinstance(value, list):
        for item in value:
            collect(item)
    elif isinstance(value, dict):
        for key, nested in value.items():
            if key not in {"include-group", "python"}:
                dependencies.append(key)
            if isinstance(nested, (list, dict)):
                collect(nested)

project = data.get("project", {})
collect(project.get("dependencies", []))
collect(project.get("optional-dependencies", {}))
collect(data.get("dependency-groups", {}))

tool = data.get("tool", {})
poetry = tool.get("poetry", {})
collect(poetry.get("dependencies", {}))
collect(poetry.get("dev-dependencies", {}))
collect(poetry.get("group", {}))

print(json.dumps({
    "name": project.get("name") or poetry.get("name"),
    "dependencies": sorted({item.lower().replace("_", "-") for item in dependencies if item}),
    "tool_keys": sorted(tool.keys()),
    "uses_poetry": bool(poetry),
}))
`;

const readText = (path) => readFileSync(path, "utf8");
const hasFile = (dir, name) => existsSync(join(dir, name));
const toPosix = (path) => path.split(sep).join("/");
const cwdFrom = (root, dir) => {
  const value = toPosix(relative(root, dir));
  return value || ".";
};
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "root";

function readJson(path) {
  return JSON.parse(readText(path));
}

function listChildDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => join(dir, entry.name));
}

function addWorkspacePattern(root, pattern, result) {
  if (typeof pattern !== "string" || pattern.includes("**")) return;
  if (pattern.endsWith("/*")) {
    for (const dir of listChildDirs(join(root, pattern.slice(0, -2)))) {
      result.add(resolve(dir));
    }
    return;
  }
  if (!pattern.includes("*")) result.add(resolve(root, pattern));
}

function findPackageDirs(root) {
  const result = new Set([resolve(root)]);
  const rootPackagePath = join(root, "package.json");

  if (existsSync(rootPackagePath)) {
    const rootPackage = readJson(rootPackagePath);
    const workspaces = Array.isArray(rootPackage.workspaces)
      ? rootPackage.workspaces
      : rootPackage.workspaces?.packages ?? [];
    for (const pattern of workspaces) addWorkspacePattern(root, pattern, result);
  }

  for (const parent of ["apps", "packages", "services"]) {
    for (const dir of listChildDirs(join(root, parent))) result.add(resolve(dir));
  }
  for (const direct of ["frontend", "backend", "web", "api"]) {
    const dir = join(root, direct);
    if (existsSync(dir) && statSync(dir).isDirectory()) result.add(resolve(dir));
  }

  return [...result].sort((left, right) =>
    cwdFrom(root, left).localeCompare(cwdFrom(root, right)),
  );
}

function inferPackageManager(dir, root, manifest) {
  const declared = manifest.packageManager?.split("@")[0];
  if (["npm", "pnpm", "yarn", "bun"].includes(declared)) return declared;

  for (const candidate of [dir, root]) {
    if (hasFile(candidate, "pnpm-lock.yaml")) return "pnpm";
    if (hasFile(candidate, "yarn.lock")) return "yarn";
    if (hasFile(candidate, "bun.lock") || hasFile(candidate, "bun.lockb")) {
      return "bun";
    }
    if (hasFile(candidate, "package-lock.json")) return "npm";
  }
  return null;
}

function parsePyproject(path) {
  for (const python of ["python3", "python"]) {
    const result = spawnSync(python, ["-c", PYPROJECT_PARSER, path], {
      encoding: "utf8",
    });
    if (!result.error && result.status === 0) return JSON.parse(result.stdout);
  }
  return null;
}

function stackFromPackage(manifest) {
  const dependencies = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
  if (dependencies.has("next")) return ["nextjs"];
  if (dependencies.has("react") && dependencies.has("vite")) {
    return ["react-vite"];
  }
  if (dependencies.has("react")) return ["react"];
  return [];
}

function packageLabel(cwd, stack) {
  if (cwd !== ".") return slugify(cwd);
  if (stack.includes("fastapi-python")) return "backend";
  if (stack.some((item) => ["react-vite", "nextjs", "react"].includes(item))) {
    return "frontend";
  }
  return "root";
}

function packageCommands({ cwd, dir, manifest, stack, root, gaps }) {
  const manager = inferPackageManager(dir, root, manifest);
  if (!manager) {
    gaps.push(`${cwd}: package manager is not proven by packageManager or lockfile`);
    return [];
  }

  const scripts = manifest.scripts ?? {};
  const label = packageLabel(cwd, stack);
  const commands = [];
  for (const proof of SCRIPT_PROOFS) {
    const script = proof.names.find((name) => typeof scripts[name] === "string");
    if (!script) continue;
    if (
      proof.cover === "test_full" &&
      /no test specified|exit 1/i.test(scripts[script])
    ) {
      gaps.push(`${cwd}: ${script} is a placeholder, not release evidence`);
      continue;
    }
    commands.push({
      id: `${label}-${proof.suffix}`,
      run: `${manager} run ${script}`,
      cwd,
      covers: [proof.cover],
    });
  }
  return commands;
}

function pythonRunner(dir, parsed) {
  if (hasFile(dir, "uv.lock")) return { prefix: "uv run", module: false };
  if (hasFile(dir, "poetry.lock") || parsed.uses_poetry) {
    return { prefix: "poetry run", module: false };
  }
  return { prefix: "python -m", module: true };
}

function pythonCommand(runner, tool, args) {
  if (runner.module) return `${runner.prefix} ${tool}${args ? ` ${args}` : ""}`;
  return `${runner.prefix} ${tool}${args ? ` ${args}` : ""}`;
}

function pyprojectCommands({ cwd, dir, parsed, stack }) {
  const dependencies = new Set(parsed.dependencies);
  const tools = new Set(parsed.tool_keys);
  const runner = pythonRunner(dir, parsed);
  const label = packageLabel(cwd, stack);
  const commands = [];

  if (dependencies.has("ruff") || tools.has("ruff")) {
    commands.push({
      id: `${label}-lint`,
      run: pythonCommand(runner, "ruff", "check ."),
      cwd,
      covers: ["lint"],
    });
  }
  if (dependencies.has("mypy") || tools.has("mypy")) {
    commands.push({
      id: `${label}-typecheck`,
      run: pythonCommand(runner, "mypy", "."),
      cwd,
      covers: ["typecheck"],
    });
  }
  if (
    dependencies.has("pytest") ||
    tools.has("pytest")
  ) {
    commands.push({
      id: `${label}-tests`,
      run: pythonCommand(runner, "pytest", "-q"),
      cwd,
      covers: ["test_full"],
    });
  }
  return commands;
}

function coversFromText(value) {
  const covers = new Set();
  if (/lint|ruff/i.test(value)) covers.add("lint");
  if (/type|mypy|pyright/i.test(value)) covers.add("typecheck");
  if (/test|pytest|unit/i.test(value)) covers.add("test_full");
  if (/build|package|image/i.test(value)) covers.add("build");
  if (/e2e|playwright|cypress/i.test(value)) covers.add("e2e");
  if (/security|audit/i.test(value)) covers.add("security");
  if (/smoke/i.test(value)) covers.add("smoke");
  return covers;
}

function parseMakefile(path) {
  if (!existsSync(path)) return new Map();
  const targets = new Map();
  let current = null;
  for (const line of readText(path).split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_.-]+)\s*:(?![=])\s*(.*)$/);
    if (match && match[1] !== ".PHONY") {
      current = match[1];
      targets.set(current, {
        dependencies: match[2].split(/\s+/).filter(Boolean),
        recipe: [],
      });
      continue;
    }
    if (current && /^\t/.test(line)) targets.get(current).recipe.push(line.trim());
    else if (line && !/^\s/.test(line)) current = null;
  }
  return targets;
}

function readCi(root) {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) return "";
  return readdirSync(dir)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => readText(join(dir, name)))
    .join("\n");
}

function aggregateCommand(root) {
  const targets = parseMakefile(join(root, "Makefile"));
  const ci = readCi(root);
  const selected = ["verify", "ci", "check", "test"].find(
    (name) =>
      targets.has(name) && new RegExp(`\\bmake\\s+${name}\\b`).test(ci),
  );
  if (!selected) return null;

  const covers = new Set();
  const visited = new Set();
  const visit = (name) => {
    if (visited.has(name)) return;
    visited.add(name);
    for (const cover of coversFromText(name)) covers.add(cover);
    const target = targets.get(name);
    if (!target) return;
    for (const cover of coversFromText(target.recipe.join(" "))) covers.add(cover);
    for (const dependency of target.dependencies) visit(dependency);
  };
  visit(selected);
  if (covers.size === 0) return null;

  return {
    id: `root-${slugify(selected)}`,
    run: `make ${selected}`,
    cwd: ".",
    covers: PROOF_ORDER.filter((proof) => covers.has(proof)),
  };
}

export function discoverCommandProfile(inputRoot) {
  const root = resolve(inputRoot);
  const gaps = [];
  const packages = [];
  const stack = new Set();

  for (const dir of findPackageDirs(root)) {
    const cwd = cwdFrom(root, dir);
    const packagePath = join(dir, "package.json");
    const pyprojectPath = join(dir, "pyproject.toml");
    const item = { cwd, dir, commands: [], names: [] };

    if (existsSync(packagePath)) {
      const manifest = readJson(packagePath);
      const detected = stackFromPackage(manifest);
      detected.forEach((value) => stack.add(value));
      item.names.push(manifest.name);
      item.commands.push(
        ...packageCommands({ cwd, dir, manifest, stack: detected, root, gaps }),
      );
    }

    if (existsSync(pyprojectPath)) {
      const parsed = parsePyproject(pyprojectPath);
      if (!parsed) {
        gaps.push(`${cwd}: pyproject.toml requires Python 3.11+ tomllib discovery`);
      } else {
        const detected = parsed.dependencies.includes("fastapi")
          ? ["fastapi-python"]
          : ["python"];
        detected.forEach((value) => stack.add(value));
        item.names.push(parsed.name);
        item.commands.push(
          ...pyprojectCommands({ cwd, dir, parsed, stack: detected }),
        );
      }
    }

    if (existsSync(packagePath) || existsSync(pyprojectPath)) packages.push(item);
  }

  const aggregate = aggregateCommand(root);
  const verify = aggregate
    ? [aggregate]
    : packages.flatMap((item) => item.commands);
  if (verify.length === 0) gaps.push("No release command is proven");

  const rootPackage = packages.find((item) => item.cwd === ".");
  const projectName = rootPackage?.names.find(Boolean) ?? basename(root);
  const roots = packages.map((item) => item.cwd);
  if (aggregate && !roots.includes(".")) roots.unshift(".");

  return {
    project_slug: slugify(projectName),
    stack: [...stack].sort(),
    command_discovery: {
      roots,
      monorepo_roots: roots.filter((value) => value !== "."),
    },
    commands: {
      test_affected: [],
      verify,
    },
    verification: {
      required_commands: verify.map((command) => command.id),
    },
    gaps: [...new Set(gaps)],
  };
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  const rootIndex = process.argv.indexOf("--root");
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : ".";
  if (!root) {
    console.error("Usage: discover-command-profile.mjs [--root <path>]");
    process.exit(2);
  }
  console.log(JSON.stringify(discoverCommandProfile(root), null, 2));
}
