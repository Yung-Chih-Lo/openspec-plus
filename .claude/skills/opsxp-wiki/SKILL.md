---
name: opsxp-wiki
description: Record a pitfall to Yung's LLM Wiki second-brain at ~/Desktop/workspace/second-brains/. Use selectively when something is worth remembering across projects — debug that took iteration, counter-intuitive fix, env/config/third-party quirk, or anything Yung says "remember this" about. Never auto-trigger; only user-invoked.
license: MIT
compatibility: "Requires second-brain repo at ~/Desktop/workspace/second-brains/. Requires git CLI."
user-invocable: true
metadata:
  author: openspec-plus
  version: "1.0"
---

Record a pitfall into Yung's [LLM Wiki second-brain](https://github.com/Yung-Chih-Lo/second-brains) so future-you (and future-AI sessions) won't repeat the same dive.

**Selective, not mandatory.** Only record when at least one trigger fires:

- Debug took non-trivial effort to resolve (more than a quick lookup or typo fix)
- Solution was counter-intuitive — future-you would forget the reasoning
- Yung said "remember this" / "下次別再踩"
- Verify revealed an unexpected side-effect **that yields a transferable lesson** (not just a bug caught and fixed locally)

**Skip** for:

- Code fixes already visible in commit diff
- Typos / "found the file by grepping" / trivial syntax issues
- One-off transient failure with no reusable lesson (provider outage, flaky DNS, transient network glitch)

**Input**: free-text description. If absent, prompt the user.

---

## Pre-flight

Verify second-brain repo exists:

```bash
test -d "$HOME/Desktop/workspace/second-brains/.git" || echo "MISSING"
```

If `MISSING` on a fresh machine → STOP and tell user to clone first:

```bash
mkdir -p ~/Desktop/workspace
git clone https://github.com/Yung-Chih-Lo/second-brains.git ~/Desktop/workspace/second-brains
```

Don't auto-create. The wiki is one canonical repo on GitHub; cloning keeps history intact and avoids forking the schema.

---

## Steps

### 1. Confirm the description

If invoked with text, use it. Otherwise prompt: "What pitfall are we recording?"

### 2. Draft slug + title + summary

- **slug**: kebab-case, descriptive, no date prefix. Must be unique under `engineer-wiki/pitfalls/`. Examples: `gh-cli-ssh-default`, `pgvector-cosine-direction`, `next-app-router-cookies-async`
- **title**: `YYYY-MM-DD <one-line description>` (today's date)
- **summary**: single sentence ≤ 120 chars, retrieval-friendly

Show the proposed slug/title/summary. Ask the user to confirm or override (options: "Use as proposed", "Edit", "Cancel").

If `~/Desktop/workspace/second-brains/engineer-wiki/pitfalls/<slug>.md` already exists, propose `<slug>-v2` or ask user for a more specific slug.

### 3. Infer project + tags

- **project**:
  - If cwd matches `~/Desktop/workspace/python/<slug>/` → `<slug>`
  - If cwd is in `~/Desktop/workspace/second-brains/` → `global`
  - Else ask
- **tags**: pick 2–5 from the issue domain (e.g. `git`, `docker`, `postgres`, `env`, `auth`, `cors`, `migration`). Propose AI's guess; allow user override.

### 4. Compose the page

Write to `~/Desktop/workspace/second-brains/engineer-wiki/pitfalls/<slug>.md` with this exact structure:

```markdown
---
title: "YYYY-MM-DD <description>"
slug: <slug>
category: pitfall
status: published
summary: <one-sentence>
project: [<project>]
tags: [<tag>, <tag>]
sources:
  - <commit hash / PR url / conversation ref>
related: [[<related-slug>]]    # optional; omit the field if none
updated: YYYY-MM-DD
---

# <title>

**症狀**

<觀察到什麼異常、什麼 error、什麼跡象。要具體：err message、command 輸出、行為差異>

**根因**

<為什麼會這樣。背後的機制 / config / 預設值 / API 行為>

**解法**

<怎麼修。給具體指令或 code block，能直接照抄那種>

**規避方式**

<下次怎麼避免：是否該寫進 pre-flight check、是否能設預設、是否需要在 onboarding doc 提醒>

**相關連結**

- <commit / PR / [[other-pitfall]] / [[wiki-page]] / 外部 doc URL>
```

**Frontmatter strictness**: don't invent fields not listed above. The canonical spec lives in `~/Desktop/workspace/second-brains/CLAUDE.md` under "Pitfall page format" — don't drift from it.

**Body strictness**: keep all 5 sections, even if one is "(無)". This makes pages predictable for retrieval.

### 5. Show full preview

Print the complete drafted file content (frontmatter + body). Ask the user:

- "Save as drafted"
- "Let me edit, then save"
- "Cancel — don't write"

If user picks edit, take their version verbatim. Don't add or remove sections.

### 6. Write the file

Use the file-write tool. Don't use heredoc shell tricks.

### 7. Update `index.md`

**Idempotency**: before appending, grep for the slug:

```bash
grep -F "[[<slug>]]" ~/Desktop/workspace/second-brains/index.md
```

If a hit exists → skip the append (entry already there from a previous retry). Otherwise:

In `~/Desktop/workspace/second-brains/index.md`, under the `### Pitfalls` section (nested inside `## Engineer Wiki`), append:

```markdown
- [[<slug>]] — <summary>
```

Newest at the top of the section. If the section currently reads `(none yet — ...)` or similar placeholder, replace the placeholder with the new entry.

### 8. Append to `log.md`

**Idempotency**: before prepending, grep for the slug + today's date heading:

```bash
grep -F "## [<YYYY-MM-DD>] new pitfall | <slug>" ~/Desktop/workspace/second-brains/log.md
```

If a hit exists → skip the prepend. Otherwise, insert at the top of `~/Desktop/workspace/second-brains/log.md` (newest first):

```markdown
## [YYYY-MM-DD] new pitfall | <slug>

- Source: <change-name | "ad-hoc"> in <project>
- Summary: <one-line>
```

### 9. Commit + push second-brains

```bash
cd "$HOME/Desktop/workspace/second-brains"
git add "engineer-wiki/pitfalls/<slug>.md" index.md log.md
git commit -m "pitfall: <slug>"
git push
```

If push fails: report exact stderr; keep the local commit. Don't roll back.

### 10. Report

```
## Wiki Ingest Complete

**Pitfall**: <slug>
**Title**: <YYYY-MM-DD ...>
**Project**: <project>
**Tags**: <tag>, <tag>
**File**: ~/Desktop/workspace/second-brains/engineer-wiki/pitfalls/<slug>.md
**Commit**: <hash> pushed to origin

GitHub: https://github.com/Yung-Chih-Lo/second-brains/blob/main/engineer-wiki/pitfalls/<slug>.md
```

---

## Guardrails

- **Don't write to Notion from this skill.** Notion is the human frontend; the LLM Wiki is the AI layer. `/opsxp-notion` handles Notion-side concerns separately.
- **Don't auto-record without confirmation.** The user picks what's worth keeping; this skill only fires when invoked.
- **Don't invent frontmatter fields** beyond the spec (`title`, `slug`, `category`, `status`, `summary`, `project`, `tags`, `sources`, `related`, `updated`).
- **Category is fixed = `pitfall`.** If the user describes a non-pitfall (e.g. an architectural decision, a framework quirk that isn't really a bug), surface that mismatch and ask whether to record it anyway as a pitfall, leave it for a future `decisions/` or `quirks/` flow, or cancel.
- **Use git CLI for the second-brain commit** — it's a local push to an already-configured remote, not a GitHub-platform op.
- **Slug uniqueness is on the writer.** Always check the file doesn't exist before writing.
- **Date everywhere is today** (`date +%Y-%m-%d`). Don't use the change's start date or any other anchor.
- **One pitfall per invocation.** If the user has multiple pitfalls from one change, run the skill once per pitfall — keeps history clean.
