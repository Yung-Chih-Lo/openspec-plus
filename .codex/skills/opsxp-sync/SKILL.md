---
name: opsxp-sync
description: Perform maintenance-only target synchronization and proven-safe branch cleanup after a user-managed merge.
---

# OPSXP Sync

This is maintenance-only Git hygiene, not part of normal Archive. The next FF already synchronizes the target branch before opening a new change.

## Safety

- Never merge a PR or change remote PR state.
- Never force-reset, force-delete, auto-stash, or overwrite dirty files.
- Never delete a branch unless it is merged into the target or its upstream is proven gone.
- Never delete a remote branch unless the user explicitly names or confirms it.
- Respect worktree ownership and preserve long-lived branches.

## Steps

1. Read repo instructions and `openspec/opsxp.yaml`; use `git.pr_target_branch`.
2. If Git is unavailable and optional, report that Sync is not applicable. If required, stop with the missing capability.
3. Inspect branch, working tree, and worktrees. Stop before mutation when any owning worktree is dirty.
4. Fetch and prune remote references.
5. Fast-forward the target branch from its upstream in the worktree that owns it. Stop on divergence; do not create a merge commit or rebase automatically.
6. List local cleanup candidates from both:
   - branches merged into the target;
   - branches whose configured upstream is gone.
7. Exclude the current branch, target, protected long-lived branches, and any branch owned by another worktree.
8. Show exact candidates and obtain confirmation unless the current request already names them.
9. Delete confirmed local candidates with safe deletion only. If Git refuses, stop rather than force.
10. Delete a remote branch only after separate explicit confirmation, then fetch/prune again.
11. Report final branch, status, and remaining active OpenSpec changes.

Do not run project tests or OpenSpec Archive. If the user only wants to begin the next change, use FF instead of Sync.
