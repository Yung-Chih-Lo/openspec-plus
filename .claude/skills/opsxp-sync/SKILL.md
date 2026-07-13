---
name: opsxp-sync
description: Safely synchronize an OPSXP/OpenSpec repository after archive, PR merge, or remote branch cleanup. Use when the user asks to update local and remote branch state, pull the target branch, prune stale refs, clean merged or gone local branches, or verify the repo is back to a clean post-change state.
---

# OPSXP Sync

Synchronize the repository with its configured target branch and clean only branches proven safe to remove. This skill is for git hygiene after `/opsxp-archive`, PR merge, or manual remote branch deletion.

## Safety Rules

- Never use `git reset --hard`.
- Never use `git branch -D`.
- Never delete a local branch unless it is either merged into the target branch or its upstream is marked `gone`.
- Never delete a remote branch unless the user explicitly asks for that exact remote branch deletion.
- Do not merge PRs or change GitHub PR state.
- If the working tree is dirty, stop and ask before switching branches or pulling.
- Preserve user-local files and config. Treat `.env*`, `.claude/settings.local.json`, `.codex/*`, and untracked work as user-owned unless the user says otherwise.

## Workflow

1. Confirm repo and config:
   - Run `pwd`.
   - Run `git status --short --branch`.
   - Read `openspec/opsxp.yaml` if present.
   - Use `git.pr_target_branch` as the target branch. If absent, ask the user for `main`, `dev`, or another branch.
   - If Git is unavailable and `git.required: false`, report that branch sync is not applicable and stop without error.
   - If Git is unavailable and Git is required or config is missing, report the exact blocker and stop.

2. Dirty tree gate:
   - If `git status --short` shows modified, staged, or untracked files, summarize them.
   - Continue only if the user explicitly says they are safe to ignore or the requested operation is read-only.
   - Do not stash automatically unless the user asks.

3. Refresh remote state:
   - Run `git fetch --prune origin`.
   - If fetch fails because of network/auth, report the exact error and stop before local deletes.

4. Check worktree ownership:
   - Run `git worktree list` when available.
   - If the target branch is checked out in another worktree, do not force checkout in the current worktree.
   - Prefer running the target-branch fast-forward from the owning worktree when it is inside the same workspace and safe to use.
   - If the owning worktree has dirty files, stop and report the exact path/status.
   - If you cannot safely operate in the owning worktree, stop and tell the user which worktree owns the target branch.

5. Switch and fast-forward target branch:
   - `git checkout <target>`
   - `git merge --ff-only origin/<target>`
   - If fast-forward is impossible, stop. Do not create a merge commit or rebase without explicit user direction.

6. Inspect cleanup candidates:
   - `git branch -vv`
   - `git branch --merged <target>`
   - Candidate categories:
     - `merged`: local branches listed by `git branch --merged <target>` excluding `*`, `<target>`, `main`, `master`, `dev`, and protected long-lived branches.
     - `gone`: local branches whose upstream marker contains `[origin/...: gone]`.

7. Confirm before deletion:
   - Show exact local branches that would be deleted.
   - Ask for confirmation unless the user already explicitly requested cleanup of those branches in the current message.
   - Use `git branch -d <branch>` only.
   - If deletion fails because Git says the branch is not fully merged, stop and report; do not force-delete.

8. Optional remote branch deletion:
   - Only when the user names a remote branch or says to delete the already-merged remote branches.
   - Show exact `origin/<branch>` targets.
   - Ask for explicit confirmation.
   - Use `git push origin --delete <branch>`.

9. Final verification:
   - Run `git fetch --prune origin` again if any remote deletion occurred.
   - Run `git status --short --branch`.
   - Run `git branch -vv`.
   - If this is an OpenSpec repo, run `openspec list` and report active changes.

## Report Format

Return this shape:

```markdown
## OPSXP Sync Complete

**Target branch**: `<target>`
**Remote refresh**: <result>
**Fast-forward**: <result>
**Deleted local branches**: <list or none>
**Deleted remote branches**: <list or none>

### Final State
- `git status --short --branch`: <summary>
- Active OpenSpec changes: <summary>

### Blockers
- <only if something stopped the sync>
```

If no mutation was safe, say so directly and leave the repo untouched.

## Common Cases

- User says "更新本地和遠端分支" → fetch/prune, fast-forward target branch, inspect cleanup candidates, then ask before deletion.
- User says "我刪掉遠端分支了，幫我清本地" → fetch/prune, find `[gone]` local branches, delete with `git branch -d` after confirmation.
- User says "archive 完幫我整理" → sync target branch and remove only merged/gone local change branches; leave unrelated feature branches alone.
