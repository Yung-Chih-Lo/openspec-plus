---
name: opsxp-doctor
description: Read-only health check for OPSXP/OpenSpec project setup. Use when a project was created from project_template, `/opsxp-setup` may be stale, Codex/Claude repo-local skills or hooks may have drifted, Notion/GitHub integration looks wrong, or an agent needs a concise diagnosis before running opsxp workflow commands.
---

# OPSXP Doctor

Run a read-only diagnostic pass over an OPSXP project. Report confirmed setup issues and concrete next actions. Do not edit files, create branches, commit, push, update Notion, or run project tests.

## Scope

Check only workflow health:

- `AGENTS.md`, `CLAUDE.md`, and root workflow instructions
- `openspec/opsxp.yaml` and `openspec/config.yaml`
- `.codex/skills/*/SKILL.md` and `.claude/skills/*/SKILL.md`
- `.claude/settings.local.json`, `.claude/hooks/*`, `.codex/hooks/*`, and any `.codex` hook/config files present
- availability of `openspec`, Git, and connector/tool surfaces when visible in the current agent runtime

Do not audit application code, dependencies, product specs, or active implementation quality. Use `/opsxp-verify` for change verification.

## Workflow

1. Confirm location:
   - Print `pwd`.
   - If `openspec/opsxp.yaml` is missing, report `FAIL` and suggest `/opsxp-setup`.
   - If this does not look like the intended repo, stop before reading unrelated project code.

2. Read project workflow files:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `openspec/opsxp.yaml`
   - `openspec/config.yaml` if present

3. Validate `openspec/opsxp.yaml`:
   - `version`
   - `project_slug`
   - `command_discovery.mode`, `command_discovery.roots`, `command_discovery.prefer`, `command_discovery.monorepo_roots`
   - `git.required`
   - `git.pr_target_branch`
   - `git.branch_prefix`
   - `git.auto_commit`
   - `git.auto_push`
   - `task_integration.notion_enabled` (or legacy `task_integration.enabled`)
   - `pr.draft_on_ff`
   - `pr.metadata_artifact`
   - `commands.test`, `commands.test_affected`, `commands.test_full`, `commands.lint`, `commands.typecheck`, `commands.build`, `commands.stack`
   - `verification.apply_full_suite`, `verification.verify_profile`, `verification.archive_requires_full_suite`, `verification.evidence_artifact`
   - Warn if `verification.apply_full_suite` is not `never`; the current OPSXP contract keeps full-suite evidence in `/opsxp-verify`.
   - Flag `<not configured>` as `WARN`, not `FAIL`, unless the user expected full verification commands.
   - Treat `commands.test` as a backward-compatible alias for `commands.test_full`; warn only if both are missing or `<not configured>` and the project expects release verification.
   - If `git.required` is `false`, Git command failures are `WARN`/`INFO` depending on the requested workflow, not automatic `FAIL`.
   - If legacy `task_integration.enabled` exists without `task_integration.notion_enabled`, report `WARN` and suggest migrating to the split Notion/PR config.
   - If `pr.metadata_artifact` is missing, warn that PR metadata will default to `openspec/changes/{change}/.pr-info.json`.
   - If `verification.evidence_artifact` is missing, warn that `/opsxp-archive` may need to rely on current-session verify output.

4. Check OpenSpec CLI:
   - Run `openspec --version` if available.
   - Run `openspec list --json` only to confirm the CLI can read the project state.
   - If OpenSpec is missing or too old for the repo instructions, report `FAIL`.

5. Check repo-local skill metadata:
   - Parse frontmatter for every `SKILL.md` under `.codex/skills` and `.claude/skills`.
   - `name` and `description` are required.
   - YAML parse errors are `FAIL`.
   - Missing description, TODO description, or duplicate skill name in the same runtime is `FAIL`.
   - Extra metadata keys are usually `INFO`; format differences between runtimes are `WARN` only when they can affect loading or invocation.

6. Compare Codex and Claude skill sets:
   - Compare skill folder names.
   - Compare `name` values.
   - Compare high-risk metadata keys such as `user-invocable` vs `user_invocable`.
   - Compare body hashes only for OPSXP skills. If the body differs, report `WARN` with filenames; do not assume which side is correct.

7. Check hooks:
   - Confirm hook script files exist and are executable or runnable by their configured command.
   - For Claude, inspect `.claude/settings.local.json` hook commands if present.
   - In reusable templates, machine-local allowlists in `.claude/settings.local.json` are `WARN`; do not keep local permission files in the template.
   - For Codex, inspect `.codex` config/hook wiring only if present. If hooks exist but no Codex wiring is present, report `WARN`, not `FAIL`.

8. Check connector assumptions:
   - If GitHub or Notion tools are visible in the current runtime, report availability.
   - If not visible, report `WARN` with the exact workflow impact:
     - `/opsxp-ff` draft PR metadata may need manual fallback when `pr.draft_on_ff` is true.
     - `/opsxp-notion` cannot write back without Notion access.
   - Do not browse the web or install connectors.

## Useful Commands

Use these as evidence, adapting paths as needed:

```bash
pwd
openspec --version
openspec list --json
find .codex/skills .claude/skills -maxdepth 2 -name SKILL.md -print
ruby -ryaml -e 'ARGV.each { |f| s=File.read(f); m=s.match(/\A---\r?\n(.*?)\r?\n---/m); raise "#{f}: missing frontmatter" unless m; y=YAML.safe_load(m[1]); raise "#{f}: missing name" unless y["name"]; raise "#{f}: missing description" unless y["description"]; puts "#{f}\t#{y["name"]}" }' .codex/skills/*/SKILL.md .claude/skills/*/SKILL.md
diff -qr .codex/skills .claude/skills
```

If a command fails because one runtime directory is absent, turn that into an explicit finding instead of masking the failure.

## Report Format

Return this shape:

```markdown
## OPSXP Doctor Report

### Verdict
PASS | WARN | FAIL

### Findings
- [FAIL] <issue> — Evidence: `<command or file>`. Fix: <specific next action>.
- [WARN] <issue> — Evidence: `<command or file>`. Fix: <specific next action>.
- [INFO] <observation>.

### Confirmed Healthy
- <short list of checked surfaces that passed>

### Next Actions
1. <smallest useful fix>
2. <optional next action>
```

Rules:

- Lead with `FAIL` and `WARN`.
- Cite file paths and command output, not guesses.
- Keep the report concise.
- Do not recommend creating new skills unless the current project_template coverage is demonstrably missing.
