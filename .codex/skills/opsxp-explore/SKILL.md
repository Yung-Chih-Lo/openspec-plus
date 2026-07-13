---
name: opsxp-explore
description: Explore a change through Socratic dialogue, repo evidence, scope pressure, and an evidence-based clarity gate before planning.
---

# OPSXP Explore

Use Socratic discovery to clarify what to build, why it matters, and what proves success. Explore is not an implementation plan and stays read-only.

## Stance

- Pain before feature: understand the failure, need, or opportunity before accepting a proposed solution.
- One consequential question at a time: follow the user's answer instead of completing a questionnaire.
- Evidence before interrogation: answer factual unknowns by reading the repo, docs, specs, Git state, or shipped behavior.
- Open threads, not scripted steps: pursue the uncertainty most likely to change the decision.
- User owns product choices and tradeoffs; the agent investigates facts, exposes consequences, and recommends.
- Do not re-derive established facts or re-litigate decisions already made.

## Socratic loop

1. Ground the discussion in current source of truth. Memory, task systems, and old conversations are retrieval hints only.
2. Identify the current belief, proposed solution, and the most consequential unproven assumption.
3. If repo evidence can resolve it, investigate first and explain what the evidence changes.
4. If user judgment is required, ask one concise question. Explain why it matters only when that is not obvious.
5. Pressure-test the answer with the strongest realistic counterexample, boundary, or tradeoff.
6. Update the shared understanding and choose the next question from the answer, not from a fixed checklist.
7. When no material uncertainty remains, converge instead of continuing to explore.

When the user asks a factual question, answer it directly. Socratic does not mean responding to every question with another question.

## Scope pressure

Use these as internal heuristics, not mandatory labels:

- Reduce when the request is too broad for one coherent change.
- Hold scope when adjacent ideas do not affect correctness.
- Expand selectively only when a missing dependency or edge changes the design.

When there is a real choice, present two or three viable options with material tradeoffs and lead with a recommendation. Do not manufacture alternatives when one path is clearly supported.

## Clarity gate

Run the gate only when the user asks to proceed or Explore is about to recommend FF. Count evidence-backed dimensions:

1. Problem: the pain or desired outcome is explicit.
2. Scope: in-scope and important non-goals are bounded.
3. Behavior: expected user or system behavior is concrete.
4. Constraints: consequential decisions and compatibility limits are resolved.
5. Proof: observable acceptance or verification evidence is known.

Show `Clarity: N/5` and list only unclear dimensions. A dimension is clear only when supported by repo evidence or an explicit user decision; do not assign subjective 1-5 ratings or average decimals.

Any unresolved question that could materially change scope, architecture, or user-visible behavior blocks FF regardless of the score. Ask the single highest-impact question and continue Explore. At `5/5`, produce the handoff and recommend FF.

## Boundaries

- Do not edit implementation code or OpenSpec artifacts.
- Do not create branches, commits, PRs, or task-system updates.
- Do not launch persona panels or parallel agents by default. Parallel research is only for independent factual investigations whose result will inform the dialogue.
- Do not force diagrams, tables, scores, or recaps into every response.

## Handoff

Keep the final decision brief compact:

- problem and desired outcome;
- chosen direction and why;
- scope and constraints;
- success evidence;
- next action: FF, Update, or continued Explore.
