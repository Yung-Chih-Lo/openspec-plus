import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const sha256 = (path) =>
  createHash("sha256").update(readFileSync(join(root, path))).digest("hex");

const skillNames = [
  "opsxp-setup",
  "opsxp-doctor",
  "opsxp-explore",
  "opsxp-ff",
  "opsxp-update",
  "opsxp-apply",
  "opsxp-verify",
  "opsxp-archive",
  "opsxp-notion",
  "opsxp-sync",
];

const legacyOpsxp = {
  "opsxp-apply": "fa9dcd48853bce4feff8d02ff972bb9966ed4800cae098f03d1580fc2500a688",
  "opsxp-archive": "a5227f0f34e2283db2e56d8f842992690c8a7b70348eab7e8cef0c05216c8b2c",
  "opsxp-debug": "c2073729dd9cd099026a17c44188f6558d2021fe4316dc051cd50235a9e94302",
  "opsxp-doctor": "91fa48abc28c743d8be36437a0789ba7274ba3ddba1d1eec9e036667f2f67233",
  "opsxp-explore": "801c8304724d7ae163e3b68a10331082e03ce5bfa43432f4cfbc7d423f660492",
  "opsxp-ff": "81baaedf039bfbe0535fae81d39a99356294cb1f7ae75168d38820a6f5546b0a",
  "opsxp-notion": "cc0386d2e318c266f993067f222d47c4062e4dd1c54f407081f48afffd339836",
  "opsxp-onboard": "9852601a8c102fbee86261dafe8ce127fdf4d04d00b38b17524570368f3b3e25",
  "opsxp-setup": "752a0a725e067be4cca3d47d5dd4ce805a77c062b434cb3dc13514500093e5fb",
  "opsxp-sync": "bd2712a559756ece5cde4328987221260c6c1f89e9a2f190a81c72e8dcc28348",
  "opsxp-verify": "4fd39b0d446628abb029c6bc4a201ae885791c485ea83f007373cdd7a2be9d3e",
  "opsxp-wiki": "b1a997ea76802c0e5d7a7c155e0c7a6c7472cdb08c8ac1e3250495afdceebce9",
};

test("OPSXP v3 contract keeps integrations and release policy explicit", () => {
  const config = read("openspec/opsxp.yaml");

  assert.match(config, /^version: 3$/m);
  assert.match(config, /contract_schema: "openspec\/opsxp\.schema\.json"/);
  assert.match(config, /sync_target_before_ff: true/);
  assert.match(config, /auto_push: when_pr_active/);
  assert.doesNotMatch(config, /when_pr_info_exists/);
  assert.match(config, /task_link_required_on_ff: false/);
  assert.match(config, /writeback_on_archive: true/);
  assert.match(config, /title_task_prefix: "\[\{task_id\}\]"/);
  assert.match(config, /body_task_link: "Completes \{task_id\}"/);
  assert.match(config, /metadata_schema: "openspec\/pr-info\.schema\.json"/);
  assert.match(config, /^  test_affected: \[\]$/m);
  assert.match(config, /^  verify: \[\]$/m);
  assert.match(config, /required_commands: \[\]/);
  assert.match(config, /archive_requires_ready_evidence: true/);
  assert.match(
    config,
    /evidence_schema: "openspec\/verification-evidence\.schema\.json"/,
  );
  assert.match(config, /hash_algorithm: sha256/);
});

test("Setup can bootstrap and migrate the complete v3 contract", () => {
  const skill = read(".codex/skills/opsxp-setup/SKILL.md");

  assert.match(skill, /assets\/opsxp\.yaml/);
  assert.match(skill, /assets\/opsxp\.schema\.json/);
  assert.match(skill, /assets\/pr-info\.schema\.json/);
  assert.match(skill, /assets\/verification-evidence\.schema\.json/);
  assert.match(skill, /opsxp\.yaml.*is missing, create it/i);
  assert.match(skill, /Create the `openspec\/` directory/i);
  assert.match(skill, /Preserve.*unknown future contract keys/i);
  assert.match(skill, /migrate.*v2.*v3/i);
  assert.match(skill, /references\/command-discovery\.md/);
  assert.match(skill, /scripts\/discover-command-profile\.mjs/);
  assert.match(skill, /assets\/docs/);
  assert.match(skill, /docs\/01-prd\.md/);
  assert.match(skill, /docs\/02-architecture\.md/);
  assert.match(skill, /Never write unresolved `\{\{\.\.\.\}\}` markers/);
  assert.match(skill, /Do not install or scaffold FastAPI, Vite, Next\.js/);
});

test("AGENTS is a compact routing map instead of a workflow encyclopedia", () => {
  const agents = read("AGENTS.md");

  assert.ok(agents.split("\n").length <= 100, "AGENTS.md should stay compact");
  assert.match(agents, /docs\/README\.md.*非 trivial 工作先讀/);
  assert.match(agents, /openspec\/opsxp\.yaml/);
  assert.match(agents, /\.codex\/skills\/opsxp-\*/);
  assert.match(agents, /可判定的規則應移到 schema、test、lint 或 CI/);
  assert.doesNotMatch(agents, /## OPSXP 主流程/);
  assert.doesNotMatch(agents, /## 專案快照/);
});

test("docs bootstrap is truthful and application frameworks stay external", () => {
  const docsIndex = read("docs/README.md");
  const setup = read(".codex/skills/opsxp-setup/SKILL.md");
  const readme = read("README.md");

  assert.match(docsIndex, /仍是 OPSXP template/);
  assert.match(docsIndex, /不要留下空白 placeholder/);
  assert.doesNotMatch(docsIndex, /\{\{/);
  for (const name of ["README.md", "01-prd.md", "02-architecture.md"]) {
    assert.equal(
      existsSync(join(root, ".codex", "skills", "opsxp-setup", "assets", "docs", name)),
      true,
      name,
    );
  }
  assert.match(setup, /Preserve authored docs/);
  assert.match(readme, /intentionally ships without an application framework/);
  assert.match(readme, /create next-app@latest apps\/web/);
  assert.match(readme, /create vite@latest apps\/web/);
  assert.match(readme, /Full Stack FastAPI Template/);

  for (const path of [
    "package.json",
    "pyproject.toml",
    "frontend",
    "backend",
    "apps",
  ]) {
    assert.equal(existsSync(join(root, path)), false, `${path} must stay external`);
  }
});

test("OPSXP and verification evidence have bundled machine-readable schemas", () => {
  const contractSchemaPath = "openspec/opsxp.schema.json";
  const evidenceSchemaPath = "openspec/verification-evidence.schema.json";
  const contractSchema = JSON.parse(read(contractSchemaPath));
  const evidenceSchema = JSON.parse(read(evidenceSchemaPath));

  assert.equal(contractSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(contractSchema.properties.version.const, 3);
  assert.deepEqual(contractSchema.$defs.auto_push.enum, [
    "manual",
    "when_pr_active",
    "always",
  ]);
  assert.equal(
    contractSchema.$defs.verify_command.properties.covers.minItems,
    1,
  );
  assert.equal(evidenceSchema.properties.schema_version.const, 1);
  assert.equal(
    evidenceSchema.properties.source.properties.hash_algorithm.const,
    "sha256",
  );
  assert.deepEqual(
    evidenceSchema.$defs.file_digest.required,
    ["path", "scope", "sha256"],
  );
  assert.equal(
    sha256(contractSchemaPath),
    sha256(".codex/skills/opsxp-setup/assets/opsxp.schema.json"),
  );
  assert.equal(
    sha256(evidenceSchemaPath),
    sha256(
      ".codex/skills/opsxp-setup/assets/verification-evidence.schema.json",
    ),
  );
});

test("PR metadata has a machine-readable v1 schema", () => {
  const schemaPath = "openspec/pr-info.schema.json";
  const schema = JSON.parse(read(schemaPath));

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.schema_version.const, 1);
  assert.deepEqual(schema.required, [
    "schema_version",
    "change",
    "project_slug",
    "task",
    "git",
    "pr",
  ]);
  assert.deepEqual(schema.$defs.notion_task.required, [
    "provider",
    "id",
    "page_id",
    "url",
  ]);
  assert.equal(
    sha256(schemaPath),
    sha256(".codex/skills/opsxp-setup/assets/pr-info.schema.json"),
  );
});

test("OpenSpec config stays minimal and leaves runtime policy to OPSXP", () => {
  const config = read("openspec/config.yaml");

  assert.match(config, /^schema: spec-driven$/m);
  assert.doesNotMatch(config, /hours|task packet|verification|Git|Notion/i);
});

for (const name of skillNames) {
  test(`${name} has concise valid skill metadata`, () => {
    const skill = read(`.codex/skills/${name}/SKILL.md`);
    assert.match(skill, new RegExp(`^---\\nname: ${name}\\n`, "m"));
    assert.match(skill, /^description: .+$/m);
    assert.ok(skill.split("\n").length < 180, `${name} is too long`);
    assert.doesNotMatch(skill, /AskUserQuestion|\bMCP\b|\bgh\b/i);
  });
}

test("official OpenSpec stays external and legacy OPSXP remains immutable", () => {
  const vendoredOfficialSkills = readdirSync(
    join(root, ".codex/skills"),
    { withFileTypes: true },
  )
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("openspec-"))
    .map((entry) => entry.name);

  assert.deepEqual(vendoredOfficialSkills, []);
  for (const [name, expected] of Object.entries(legacyOpsxp)) {
    assert.equal(sha256(`.claude/skills/${name}/SKILL.md`), expected, name);
  }
});

test("public distribution states compatibility and excludes unrelated skills", () => {
  const readme = read("README.md");
  const notice = read("NOTICE");
  const ignore = read(".gitignore");
  const workflow = read(".github/workflows/validate.yml");

  assert.match(readme, /@fission-ai\/openspec@1\.6\.0/);
  assert.match(readme, /openspec (status|validate|archive)/i);
  assert.match(readme, /Do \*\*not\*\* run `openspec init`/);
  assert.doesNotMatch(readme, /^\s*openspec init\s*$/m);
  assert.match(
    readme,
    /git clone https:\/\/github\.com\/Yung-Chih-Lo\/openspec-plus\.git/,
  );
  assert.match(readme, /\.claude\/skills\/opsxp-\*/);
  assert.match(readme, /Notion/i);
  assert.match(notice, /OpenSpec/i);
  assert.match(read("LICENSE"), /MIT License/);
  assert.match(ignore, /^\/\.codex\/skills\/fastapi-templates\/$/m);
  assert.match(ignore, /^\/\.claude\/skills\/fastapi-templates\/$/m);
  assert.match(workflow, /@fission-ai\/openspec@1\.6\.0/);
  assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
});

test("deprecated follow-up and closeout phases are absent", () => {
  assert.equal(existsSync(join(root, ".codex/skills/opsxp-followup")), false);
  assert.equal(existsSync(join(root, ".codex/skills/opsxp-closeout")), false);
});

test("FF creates short tasks and preserves Notion to draft PR linkage", () => {
  const skill = read(".codex/skills/opsxp-ff/SKILL.md");

  assert.match(skill, /one task is valid/i);
  assert.doesNotMatch(skill, /3-10 ordered tasks/i);
  assert.match(skill, /one sentence/i);
  assert.match(skill, /body task link/i);
  assert.match(skill, /draft PR/i);
  assert.match(skill, /sync_target_before_ff/);
  assert.match(skill, /pr\.metadata_schema/);
  assert.match(skill, /against `pr\.metadata_schema`/);
  assert.match(skill, /one initial commit and push/i);
  assert.match(skill, /next coherent commit/i);
});

test("Explore is Socratic and uses an evidence-based clarity count", () => {
  const skill = read(".codex/skills/opsxp-explore/SKILL.md");

  assert.match(skill, /Socratic loop/);
  assert.match(skill, /One consequential question at a time/);
  assert.match(skill, /Clarity: N\/5/);
  assert.match(skill, /Problem:/);
  assert.match(skill, /Scope:/);
  assert.match(skill, /Behavior:/);
  assert.match(skill, /Constraints:/);
  assert.match(skill, /Proof:/);
  assert.match(skill, /blocks FF regardless of the score/);
  assert.doesNotMatch(skill, /average rounded|3 parallel Agent/i);
});

test("Apply keeps RED GREEN but excludes release verification", () => {
  const skill = read(".codex/skills/opsxp-apply/SKILL.md");
  const red = skill.indexOf("RED");
  const green = skill.indexOf("GREEN");

  assert.ok(red >= 0 && green > red);
  assert.match(skill, /targeted|unit test/i);
  assert.match(skill, /commands\.test_affected/);
  assert.match(skill, /Do not run.*commands\.verify/i);
  assert.match(skill, /Do not run.*build.*E2E/i);
  assert.match(skill, /when_pr_active/);
  assert.doesNotMatch(skill, /metadata artifact validates.*push/i);
});

test("Verify short-circuits before full tests and writes evidence", () => {
  const skill = read(".codex/skills/opsxp-verify/SKILL.md");
  const readiness = skill.indexOf("Readiness gate");
  const full = skill.indexOf("Full verification");

  assert.ok(readiness >= 0 && full > readiness);
  assert.match(skill, /verification\.required_commands/);
  assert.match(skill, /commands\.verify/);
  assert.match(skill, /E2E/);
  assert.match(skill, /verification\.evidence_schema/);
  assert.match(skill, /hash_algorithm/);
  assert.match(skill, /contract_fingerprint/);
  assert.match(skill, /artifact_fingerprint/);
  assert.match(skill, /implementation_fingerprint/);
  assert.match(skill, /path.*scope.*sha256/i);
  assert.match(skill, /READY \| BLOCKED/);
});

test("Archive stops at ready PR and never owns merge or sync", () => {
  const skill = read(".codex/skills/opsxp-archive/SKILL.md");

  assert.match(skill, /openspec archive -y/);
  assert.match(skill, /mark.*ready/i);
  assert.match(skill, /remote.*HEAD.*local.*HEAD/i);
  assert.match(skill, /do not mark.*ready/i);
  assert.match(skill, /verification\.evidence_schema/);
  assert.match(skill, /six sections for PR and Notion/i);
  assert.match(skill, /Do not run project tests/i);
  assert.match(skill, /Do not merge/i);
  assert.match(skill, /stay on the feature branch/i);
  assert.doesNotMatch(skill, /git (checkout|switch|merge) /);

  assert.ok(
    skill.indexOf("openspec status") < skill.indexOf("PR metadata"),
    "Archive must resolve changeRoot before PR metadata",
  );
  assert.ok(
    skill.indexOf("remote branch HEAD") < skill.indexOf("mark the PR ready"),
    "Archive must prove the remote head before marking ready",
  );
});

test("Doctor validates command IDs, schemas, and release-policy conflicts", () => {
  const skill = read(".codex/skills/opsxp-doctor/SKILL.md");

  assert.match(skill, /version: 3/);
  assert.match(skill, /unique command IDs/i);
  assert.match(skill, /required_commands/);
  assert.match(skill, /evidence schema/i);
  assert.match(skill, /auto_commit.*auto_push.*draft/i);
});

test("release gate state matrix permits only complete remote-ready transitions", () => {
  const canMarkReady = ({
    freshReadyEvidence,
    archiveCommitted,
    remoteMatchesLocal,
  }) => freshReadyEvidence && archiveCommitted && remoteMatchesLocal;

  assert.equal(
    canMarkReady({
      freshReadyEvidence: true,
      archiveCommitted: true,
      remoteMatchesLocal: true,
    }),
    true,
  );
  for (const blocked of [
    {
      freshReadyEvidence: false,
      archiveCommitted: true,
      remoteMatchesLocal: true,
    },
    {
      freshReadyEvidence: true,
      archiveCommitted: false,
      remoteMatchesLocal: true,
    },
    {
      freshReadyEvidence: true,
      archiveCommitted: true,
      remoteMatchesLocal: false,
    },
  ]) {
    assert.equal(canMarkReady(blocked), false);
  }
});

test("auto-push state matrix is independent from metadata", () => {
  const shouldAutoPush = ({ policy, prActive }) =>
    policy === "always" || (policy === "when_pr_active" && prActive);

  for (const metadataEnabled of [true, false]) {
    assert.equal(
      shouldAutoPush({
        policy: "manual",
        prActive: true,
        metadataEnabled,
      }),
      false,
    );
    assert.equal(
      shouldAutoPush({
        policy: "when_pr_active",
        prActive: true,
        metadataEnabled,
      }),
      true,
    );
    assert.equal(
      shouldAutoPush({
        policy: "when_pr_active",
        prActive: false,
        metadataEnabled,
      }),
      false,
    );
    assert.equal(
      shouldAutoPush({
        policy: "always",
        prActive: false,
        metadataEnabled,
      }),
      true,
    );
  }
});

test("required-command state matrix blocks missing, skipped, or failed proof", () => {
  const isReady = (requiredIds, results) =>
    requiredIds.every(
      (id) => results.find((result) => result.id === id)?.status === "PASS",
    );

  const required = ["backend-tests", "frontend-build"];
  assert.equal(
    isReady(required, [
      { id: "backend-tests", status: "PASS" },
      { id: "frontend-build", status: "PASS" },
    ]),
    true,
  );
  assert.equal(
    isReady(required, [{ id: "backend-tests", status: "PASS" }]),
    false,
  );
  assert.equal(
    isReady(required, [
      { id: "backend-tests", status: "PASS" },
      { id: "frontend-build", status: "SKIPPED" },
    ]),
    false,
  );
  assert.equal(
    isReady(required, [
      { id: "backend-tests", status: "PASS" },
      { id: "frontend-build", status: "FAIL" },
    ]),
    false,
  );
});

test("Notion is retry-only and sync is maintenance-only", () => {
  const notion = read(".codex/skills/opsxp-notion/SKILL.md");
  const sync = read(".codex/skills/opsxp-sync/SKILL.md");

  assert.match(notion, /retry/i);
  assert.match(notion, /pr\.metadata_artifact/);
  assert.match(notion, /pr\.metadata_schema/);
  assert.match(notion, /Do not hardcode `.pr-info\.json`/);
  assert.match(notion, /Never update.*status/i);
  assert.match(sync, /maintenance-only/i);
  assert.match(sync, /Never merge a PR/i);
});
