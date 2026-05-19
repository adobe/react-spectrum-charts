# Run Epic: Multi-Agent Implementation Orchestrator

Orchestrates parallel implementation of a Jira epic across isolated git worktrees. Reads the epic,
classifies tasks, dispatches subagents in dependency-ordered batches, reviews conflicts, and
produces a per-worktree summary for manual review and merge.

**Usage:** `/run-epic <EPIC-KEY>` (e.g. `/run-epic RSC-123`)

---

## Directory Structure

Create this structure in the main working directory before dispatching any subagent:

```
planning/
  <epic-key>/
    epic.md              — full epic description and acceptance criteria
    manifest.json        — task list with types, deps, batch assignments (written once; read-only after)
    tsc_baseline.txt     — pre-existing TSC errors on main (captured in Phase 1; used to filter noise)
    tasks/
      <task-id>.md       — full Jira ticket content per task (updated with outcome in Phase 7)
    status/
      <task-id>.json     — written by orchestrator after each subagent returns
      spikes.json        — per-spike lifecycle state (dispatched → surfaced → decided → impl_dispatched)
    escalations/
      <task-id>.md       — written by orchestrator if a subagent returned unresolved questions
    spikes/
      <task-id>.md       — findings from research spike subagents
    summary.md           — final cross-task overview (written in Phase 7)
```

Subagents do NOT write to planning files. All planning files are written by the orchestrator,
using the structured output returned in each subagent's final message.

---

## Orchestrator Role Boundary

**The orchestrator never writes, edits, or investigates code.** This is a hard rule with no exceptions.

### What the orchestrator does
- Reads planning files (`planning/<epic-key>/`) and manifest data
- Fetches Jira tickets and Figma data
- Classifies tasks, assigns batches, dispatches subagents
- Surfaces agent results and user decisions
- Writes status/spike/escalation planning files

### What the orchestrator never does
- Reads source files, test output, or build logs from worktrees
- Runs `epic-build.sh`, `epic-tsc.sh`, or `epic-test.sh` directly
- Edits or writes any file in a worktree
- Implements even a "small fix" inline

Every code change — no matter how small — goes to a subagent. If the user provides a
"needs-change" decision, re-dispatch a follow-up subagent with the user's instructions injected;
do not implement the change yourself.

### Recovery subagent pattern

If a subagent times out, stalls, or fails to produce an AGENT-RESULT block, spawn a recovery
subagent into the same worktree branch. Never investigate or fix the incomplete state yourself.

**Recovery subagent prompt template:**

```
A previous agent working on <task-id> did not complete. Your job is to assess the current state
and finish any remaining steps.

## Worktree
/tmp/epic-<epic-key>/<task-id> on branch <worktreeBranch>

## What the previous agent was doing
<brief description: e.g. "running epic-build.sh — may or may not have completed">

## What needs to happen
1. Check git status to see what files are already staged or committed
2. If build was not run: `./scripts/epic-build.sh /tmp/epic-<epic-key>/<task-id>`
3. If TSC was not run: `./scripts/epic-tsc.sh /tmp/epic-<epic-key>/<task-id>`
4. If tests were not run: `./scripts/epic-test.sh /tmp/epic-<epic-key>/<task-id>`
5. If files are not committed: commit them
6. Produce the AGENT-RESULT block

## Pre-existing TSC errors to ignore
<paste content of planning/<epic-key>/tsc_baseline.txt>

<paste original task prompt here>
```

Violating this boundary bloats the orchestrator's context and makes iterations harder to track.

---

## Phase 1: Epic Ingestion

Use `mcp__corp-jira__search_jira_issues` to fetch the epic and all child issues.

For the epic itself, capture: title, description, acceptance criteria, labels, priority, and the
list of child issue keys.

For each child issue, fetch the full ticket: title, description, acceptance criteria, story points,
labels, and any linked issues (which indicate dependencies).

Write `planning/<epic-key>/epic.md`:
```markdown
# <Epic Title> (<EPIC-KEY>)

## Description
<full description>

## Acceptance Criteria
<list>

## Child Issues
| Key | Title | Type | Points |
|-----|-------|------|--------|
| ... | ...   | ...  | ...    |
```

Write one `planning/<epic-key>/tasks/<task-id>.md` per child issue with its full content.

### TSC Baseline Capture

After writing the task files but before Phase 2, capture the pre-existing TSC errors on `main`
so agents can distinguish their own errors from inherited ones:

```bash
yarn tsc --noEmit 2>&1 | grep "^packages/" | sort > planning/<epic-key>/tsc_baseline.txt
```

Write the output to `planning/<epic-key>/tsc_baseline.txt`. If the file is empty, the codebase
has no pre-existing TSC errors. Inject the contents of this file into every subagent prompt
(see subagent prompt template in Phase 4) so agents know which errors to ignore.

---

## Phase 2: Task Classification and Dependency Graph

Classify each task and build a dependency graph before dispatching anything.

### Task Type Mapping

| Ticket signal | Type | Skill |
|---|---|---|
| Creates a new top-level mark (new mark type, new visualization) | `new-mark` | `.claude/commands/implement-new-chart-mark.md` |
| Adds a child component nested inside an existing mark | `new-child-component` | `.claude/commands/implement-new-child-component.md` |
| Adds a prop to an existing mark or component | `new-prop` | `.claude/commands/implement-new-prop.md` |
| Bug report, incorrect behavior, regression | `bug-fix` | `.claude/commands/implement-bug-fix.md` |
| Research, investigation, spike | `research-spike` | `.claude/commands/implement-research-spike.md` |

**Research spike handling:** Spikes produce findings documents, not code. A spike subagent writes
its output to `planning/<epic-key>/spikes/<task-id>.md`. Any feature task that depends on a spike
must be in a later batch — inject the spike findings into the feature subagent's prompt under
"Context from dependent spike" so it can use the research without re-doing it.

### Dependency Rules

Determine dependencies from: Jira "blocks / is blocked by" links, ticket descriptions that
reference other tickets, and structural rules:

- A `new-prop` on a mark that doesn't exist yet depends on the `new-mark` task for that mark
- A `new-child-component` for a mark that doesn't exist yet depends on the `new-mark` task
- Any task whose description says "after X is implemented" or "builds on X" depends on X
- A `research-spike` that feeds into a feature creates a dependency: feature depends on spike

### Batch Assignment

Assign tasks to batches using topological sort:
- Batch 1: tasks with no unresolved dependencies
- Batch 2: tasks whose only dependencies are in batch 1
- Continue until all tasks are assigned

Maximum 3 subagents run concurrently within a batch. If a batch has more than 3 tasks, split it
into sub-batches of 3 and run them sequentially within the batch.

### Storybook Port Assignment

Assign a unique port to each non-spike task starting at 6011, incrementing continuously across all
batches. Spike tasks set `storybookPort: null`.

### File Touch Prediction

For each task, predict which source files it will edit based on task type and the target mark.
Write these predictions into `manifest.json` — Phase 3 reads them to build the conflict hotspot
table without re-deriving from scratch.

**Per-type prediction rules:**

| Type | Files always touched |
|---|---|
| `new-mark` | `chartSpecBuilder.ts`, `childrenAdapter.ts`, `utils.ts`, `chartAdapter.test.ts`, both `types/marks/index.ts`, `components/index.ts`, plus mark-specific `*Spec.types.ts`, `*SpecBuilder.ts`, `*MarkUtils.ts`, `*TestUtils.ts`, `*Adapter.ts` |
| `new-child-component` | `childrenAdapter.ts`, `utils.ts`, `chartAdapter.test.ts`, `components/index.ts`, parent mark's `*TestUtils.ts`, parent mark's `*Adapter.ts`, supplemental `types/marks/supplemental/index.ts` |
| `new-prop` | parent mark's `*Spec.types.ts`, parent mark's `*SpecBuilder.ts`, `chartAdapter.test.ts` |
| `bug-fix` | infer from ticket description — identify the specific file(s) the bug lives in |
| `research-spike` | none (produces findings documents only) |

Use repo-relative paths (e.g. `packages/vega-spec-builder-s2/src/line/lineSpec.types.ts`).

### Write `manifest.json`

```json
{
  "epicKey": "RSC-123",
  "epicTitle": "...",
  "generatedAt": "<ISO timestamp>",
  "tasks": [
    {
      "id": "RSC-124",
      "title": "...",
      "type": "new-prop",
      "skill": ".claude/commands/implement-new-prop.md",
      "dependencies": [],
      "batch": 1,
      "subBatch": "1-1",
      "changeDescription": "2-3 word summary of the change",
      "storybookPort": 6011,
      "worktreeBranch": "epic/rsc-123/rsc-124",
      "predictedFilesTouched": [
        "packages/vega-spec-builder-s2/src/line/lineSpec.types.ts",
        "packages/vega-spec-builder-s2/src/line/lineSpecBuilder.ts",
        "packages/react-spectrum-charts-s2/src/rscToSbAdapter/chartAdapter.test.ts"
      ]
    }
  ]
}
```

---

## Phase 3: Conflict Hotspot Pre-analysis

Before dispatching, build the hotspot table by inverting the `predictedFilesTouched` arrays from
`manifest.json`: for each file, collect every task that lists it. Any file touched by 2+ tasks is
a hotspot.

Present the results to the user as a warning table before dispatch:

| File (shortened) | Tasks | Count |
|---|---|---|
| `chartAdapter.test.ts` | RSC-124, RSC-127, RSC-129 | 3 |
| `lineSpec.types.ts` | RSC-124, RSC-127 | 2 |

> **Conflict hotspots detected:**
> `chartAdapter.test.ts` will be edited by: RSC-124, RSC-127, RSC-129
> These worktrees cannot be merged in arbitrary order. The conflict resolution agent will produce
> a recommended merge sequence.

Continue dispatch regardless — the conflict resolver handles this in Phase 6.

### Why file prediction lives in Phase 2

The `predictedFilesTouched` field on each manifest task is the single source of truth for conflict
analysis. Predicting files during planning (Phase 2) rather than at dispatch time means:
- The hotspot table is available before any subagent runs
- Phase 6 (conflict resolver) can use the same data to target its `git diff` calls
- Adding a new task type only requires updating the per-type prediction rules above, not the
  conflict analysis logic

---

## Spike State Tracking

All spike lifecycle transitions are recorded in `planning/<epic-key>/status/spikes.json`. This
file is the single source of truth for resuming after a session restart or context compaction.

### Schema

```json
{
  "spikes": [
    {
      "id": "AN-450446",
      "title": "...",
      "status": "dispatched | surfaced | decided | impl_dispatched | completed | deferred",
      "deferralReason": "<quote from ticket if deferred>",
      "worktreeBranch": "epic/AN-450439/AN-450446",
      "decisions": [
        { "question": "...", "answer": "...", "decidedAt": "<ISO timestamp>" }
      ],
      "implementationTaskId": "AN-450446",
      "implDispatchedAt": "<ISO timestamp>"
    }
  ]
}
```

### Lifecycle transitions

| Event | `status` value | When to write |
|-------|---------------|---------------|
| Worktree created, subagent dispatched | `dispatched` | Before sending the Agent call |
| Spike result surfaced to user | `surfaced` | After presenting proposals |
| All decisions resolved | `decided` | After writing `spikes/<task-id>.md` |
| Implementation subagent dispatched | `impl_dispatched` | Before sending the impl Agent call |
| Implementation approved and pushed | `completed` | After user approves and PR is created |
| Ticket flagged as deferred | `deferred` | When deferral check fires (see below) |

**On session restart:** read `spikes.json` first to reconstruct state. Spikes in `dispatched` or
`surfaced` state may need to be re-dispatched or re-surfaced. Spikes in `decided` but not
`impl_dispatched` have unstarted implementations — queue them immediately.

---

## Phase 4: Dispatch Implementation Subagents

Dispatch one batch at a time. Within a batch, send all subagent calls in a single message so they
run in parallel. Wait for all subagents in a batch to complete before starting the next batch.

### Approved Scripts — Use These Instead of Raw Interpreters

Never call `python3`, `node`, or other interpreters directly. Use the pre-approved scripts instead:

| Need | Script | Example |
|---|---|---|
| Query a JSON file | `./scripts/epic-json-query.sh <file> <jq-expr>` | `./scripts/epic-json-query.sh planning/AN-450439/manifest.json '.tasks[].id'` |
| List all manifest tasks | `./scripts/epic-manifest-list.sh <epic-key>` | `./scripts/epic-manifest-list.sh AN-450439` |
| Build s2 packages | `./scripts/epic-build.sh <worktree>` | — |
| Type check | `./scripts/epic-tsc.sh <worktree>` | — |
| Run full test suite | `./scripts/epic-test.sh <worktree>` | — |
| Run tests matching pattern | `./scripts/epic-test.sh <worktree> <pattern>` | — |
| Start Storybook | `./scripts/epic-storybook.sh <worktree> <port>` | — |

These are all pre-approved via `Bash(./scripts/epic-*.sh*)` in `.claude/settings.json` and will
never trigger a permission prompt. Direct interpreter calls (`python3 -c ...`, `node -e ...`) are
not in the allowlist and will prompt the user every time.

### Spike Deferral Check (for research-spike tasks only)

Before creating a worktree or dispatching any spike subagent, read the ticket description and
check for deferral signals:

- "Do not implement until explicitly requested"
- "Implement last"
- "requires a design meeting"
- "requires external input before implementation"
- "deferred until"

If any such signal is present, do NOT dispatch the spike. Instead, present to the user:

```
## Spike: <task-id> — <title>

This spike is flagged as deferred:
> "<exact quote of the deferral signal from the ticket>"

**Recommendation:** Skip for now — dispatch only when the external dependency resolves.

Your decision: skip / force-dispatch anyway
```

If the user says skip: set `status: "deferred"` in `spikes.json` with the `deferralReason` field
set to the quoted signal. Do not create a worktree. Move on to the next spike.

If the user says force-dispatch: proceed normally.

### One-Time Epic Prerequisites (before dispatching batch 1)

Before dispatching any agents, ensure agentPod has dependencies installed:

```bash
./scripts/epic-install.sh
```

This installs `node_modules` in the agentPod worktree. Only needs to run once per epic session —
subsequent batches skip it since `node_modules` already exists.

### Worktree Setup (before dispatching each sub-batch)

Do NOT use `isolation: "worktree"` on the Agent tool — it does not work when the orchestrator is
already running inside a git worktree (worktrees have a `.git` file, not a `.git` directory, and
the isolation implementation fails silently in this case).

Instead, for **every** task in the sub-batch (including spikes — they produce prototype code),
create a worktree with the single setup script:

```bash
./scripts/epic-worktree-create.sh <epic-key> <task-id> <worktreeBranch>
```

This script: creates the git worktree, copies all `epic-*.sh` scripts into it, and symlinks
`node_modules` from the orchestrator root so agents can build without reinstalling.

**Permissions note:** Subagents launched via the Agent tool share the orchestrator's Claude Code
session and use the main project's `.claude/settings.json`. There is no per-worktree settings
file — the main settings cover everything: `Edit(*)`, `Write(*)`, and all pre-approved scripts.

**node_modules strategy:** `epic-setup.sh` (called by `epic-worktree-create.sh`) symlinks
`node_modules` from the orchestrator root into each epic worktree. `epic-install.sh` must run once
before dispatching batch 1. Each worktree manages its own build artifacts (`dist/`) — source
changes require rebuilding via `epic-build.sh`. Workspace symlinks point to the orchestrator's
packages, which is fine since all tasks target s2-only files and don't modify s1 packages.

Where `<worktreeBranch>` comes from the task's `worktreeBranch` field in `manifest.json`
(e.g. `epic/AN-450439/AN-450444`). Run all setup commands before dispatching any agents.

**Workspace validation (first sub-batch only):** After creating the first worktree but before
dispatching any agents, verify workspace cross-links are wired correctly:

```bash
ls /tmp/epic-<epic-key>/<first-task-id>/node_modules/@spectrum-charts/
```

If the `@spectrum-charts/` packages are not present, the symlink is broken — run
`./scripts/epic-setup.sh /tmp/epic-<epic-key>/<first-task-id>` to fix it before dispatching
anything. A build inside the worktree will fail silently if cross-links are missing.

### Figma Data Injection (for any task with Figma references)

Do NOT instruct agents to call Figma MCP tools themselves. Instead, before dispatching **any task**
(spike, implementation, or otherwise) that references a Figma node URL, the orchestrator fetches
the data using `mcp__figma__get_figma_node` and injects the raw node data into the agent's prompt
under a "## Figma Reference Data" section. This keeps Figma access in the orchestrator where it is
authenticated, not in subagents.

This applies to all task types: `new-mark`, `new-child-component`, `new-prop`, `bug-fix`, and
`research-spike`. A task without Figma design data is implementing based on guesses — always
fetch before dispatch.

**Always fetch the SVG, not just the node structure.** Use `mcp__figma__get_figma_image` with
`format: "svg"`, download the SVG, and parse it for exact values: `fill`, `stroke`, `strokeWidth`,
`r` (radius), `width`, `height`. The SVG is exported at 2x scale — divide coordinate values by 2
to get actual pixel values. The SVG is the ground truth for rendering approach (e.g. a single
circle with a stroke is not the same as two layered circles, even if both produce a similar visual).
Inject both the node structure and the parsed SVG values into the agent prompt.

If `mcp__figma__get_figma_node` fails (e.g. MCP server error), do NOT dispatch the task. Surface
the error to the user and ask whether to retry the fetch, provide the design data another way, or
skip the task.

### Pre-Dispatch Design Question Check

Before constructing a subagent prompt for any implementation task, review the ticket description
and Figma data for open design questions — decisions about behavior, visual treatment, API shape,
or interaction model that are not fully specified. Common examples:

- "Should X also respond to Y hover signal?"
- "When the user does Z, which of these two behaviors is correct?"
- "The Figma shows A but the existing code does B — which takes precedence?"

If any such questions exist, **present them to the user and get decisions before dispatching**.
Use the same escalation format as Phase 5. Inject the user's decisions into the subagent prompt
under a "## Design Decisions" section so the agent implements the correct behavior on the first
attempt rather than guessing and iterating.

Do not skip this step in the interest of speed — one design question surfaced before dispatch
saves more time than three wrong implementations.

### Subagent Prompt Template

Construct a self-contained prompt for each subagent. The subagent has no context from this
conversation — everything it needs must be in the prompt.

**Implementation agent prompt:**

```
You are implementing a single Jira ticket as part of a larger epic. Work only on the task
described below. Do not implement anything from other tickets.

## Your Worktree

Your isolated working directory is: /tmp/epic-<epic-key>/<task-id>
This is a git worktree on branch <worktreeBranch>. Run ALL file edits and Bash commands from
this directory. Verify it exists before starting: ls /tmp/epic-<epic-key>/<task-id>

## Your Task

**Jira Key:** <task-id>
**Type:** <type>
**Title:** <title>

### Full Ticket Description
<paste full content from planning/<epic-key>/tasks/<task-id>.md>

## How to Implement

Follow the skill file at `<skill-path>` exactly. Read it before writing any code.
Also read `.claude/architecture.md` for system context.

<IF batch > 1 AND has dependencies>
The following tasks completed before yours. Their implementations are already on branches
that will be merged before yours. You can assume these types/components exist:
<list what was implemented in dependency tasks>
</IF>

## Storybook

Your assigned Storybook port is <port>. Use the pre-approved script to verify your stories:
  `./scripts/epic-storybook.sh /tmp/epic-<epic-key>/<task-id> <port>`
At least one story is required as a completion gate.

## Build, Type Check, and Tests

Before completing, use the pre-approved scripts from your worktree directory:
1. `./scripts/epic-build.sh /tmp/epic-<epic-key>/<task-id>`
2. `./scripts/epic-tsc.sh /tmp/epic-<epic-key>/<task-id>`
3. `./scripts/epic-test.sh /tmp/epic-<epic-key>/<task-id>` — **run with NO pattern to execute the full test suite**

**Important for build:** The build takes 30–60 seconds. Run it synchronously and wait — do NOT
use background execution, do NOT write "let me monitor the build", just let the Bash tool wait
for it to complete. Use a timeout of 120000ms when calling the Bash tool.

**Important for TSC:** Some errors are pre-existing on `main` and are not your fault. The
orchestrator has injected them below. When evaluating TSC output, only fail if you see errors
that are NOT in the pre-existing list. Set `TSC_PASSED: true` if all errors are pre-existing.

**Pre-existing TSC errors to ignore:**
<paste content of planning/<epic-key>/tsc_baseline.txt here — or write "none" if file is empty>

Pattern-filtered test runs (`epic-test.sh <worktree> <pattern>`) are only for development
iteration — the final gate before committing must be the full suite with no filter. If any step
fails, fix the errors before completing.

These scripts are pre-approved in `.claude/settings.json`. Always use them instead of calling
`yarn` directly — direct yarn calls may require manual approval.

## Handling Uncertainty

If you are uncertain about an implementation decision:
- Do NOT stall. Implement your best-guess solution.
- Mark uncertain sections with an inline comment: `// ESCALATION(<task-id>): <brief question>`
- Include a structured escalation block in your final output message (see output format below).

## Required Output Format

End your response with this block EXACTLY — the orchestrator parses it:

---AGENT-RESULT---
STATUS: completed | needs-human-input | failed
WORKTREE_BRANCH: <the branch name — should match <worktreeBranch>>
FILES_CHANGED:
- <path>
- <path>
STORIES_ADDED:
- <path>
BUILD_PASSED: true | false
TSC_PASSED: true | false
TESTS_PASSED: true | false
SUMMARY:
<2-4 sentence description of what was implemented>
ESCALATIONS:
<If none, write "none". Otherwise, one block per question:>
QUESTION: <clear question>
CONTEXT: <relevant code excerpt or type name>
OPTIONS:
  1. <option A> — tradeoff: <...>
  2. <option B> — tradeoff: <...>
RECOMMENDATION: <your best guess>
---END-RESULT---
```

### Subagent Completion Gate — STOP AND CHECK IN

**Every completed subagent requires explicit user approval before the orchestrator takes any
further action.** Do not write status files, do not set up the next sub-batch, do not dispatch
any further agents until the user has reviewed and approved each result.

As soon as an agent completes, present its result to the user in this format:

```
## Result: <task-id> — <task title> [<type>]

**Status:** <STATUS>
**Build:** <BUILD_PASSED> | **TSC:** <TSC_PASSED> | **Tests:** <TESTS_PASSED>

**Summary:** <SUMMARY from agent>

**Files changed:** <list>
**Stories added:** <list>

<If BUILD_PASSED: false or TSC_PASSED: false:>
⚠️ Build/TSC failed. Agent explanation: <explain why — pre-existing vs. this ticket's fault>

<If type is research-spike:>
**Spike proposals:**

| # | Name | Summary | Tradeoffs |
|---|------|---------|-----------|
| 1 | <SOLUTION_1.NAME> | <SOLUTION_1.SUMMARY> | <SOLUTION_1.TRADEOFFS> |
| 2 | <SOLUTION_2.NAME> | <SOLUTION_2.SUMMARY> | <SOLUTION_2.TRADEOFFS> |
| 3 | <SOLUTION_3.NAME — omit row if not present> | ... | ... |

**Agent recommendation:** <RECOMMENDATION>
**Prototype:** <PROTOTYPE_PATH — include link if Vega spec, otherwise file path>

**Your decision:** Which solution should we pursue? (enter 1, 2, 3, or describe a custom direction)

Note: After the user picks a solution, follow up with any remaining sub-decisions
(collision handling, positioning, reusability, etc.) one at a time before writing the spike doc.
Background research subagents for those sub-decisions should already be in flight.

<If ESCALATIONS present:>
**Escalations:** (see Phase 5 below)

**Your decision:** approve / retry / skip / needs-change: <your instructions>
```

**Before presenting the result to the user**, if `STORIES_ADDED` is non-empty AND
`BUILD_PASSED: true`, start Storybook for the worktree in the background.

**Port:** Always read the port from `manifest.json` — use the `storybookPort` field for the task's
entry. Never guess or reuse another task's port. Confirm the value before running the script.

```bash
./scripts/epic-storybook.sh /tmp/epic-<epic-key>/<task-id> <storybookPort-from-manifest>
```

If `BUILD_PASSED: false`, do NOT start Storybook — the dist/ is stale and would show the wrong
output. Instead, surface the build failure to the user in the check-in and ask whether to retry.

Wait ~15 seconds for Storybook to start, then include the direct story URL in the check-in:
`http://localhost:<storybookPort>/?path=/story/<story-id>`

The story ID is derived from the story's `title` and export name (e.g.
`title: 'React Spectrum Charts 2/Line/Features/StaticPoint'` + export `WithStaticPoint` →
`react-spectrum-charts-2-line-features-staticpoint--with-static-point`).

This lets the user visually verify the implementation before approving.

Wait for the user's response before proceeding. The valid responses are:
- **approve** — commit, push, open a PR, write the status file, then continue
- **retry** — re-dispatch the agent with additional context the user provides
- **skip** — mark as skipped in the status file, do not merge this worktree
- **needs-change: <instructions>** — re-dispatch a follow-up subagent into the same worktree
  branch with the original task prompt plus the user's specific instructions; the orchestrator
  does NOT implement the change itself

**On approve**, the orchestrator (not the subagent) handles commit, push, and PR:

```bash
# Commit
cd /tmp/epic-<epic-key>/<task-id>
git add <files from FILES_CHANGED list — explicit, no git add -A>
git commit -m "$(cat <<'EOF'
feat(s2): <task-id> <concise description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# Push
git push -u origin <worktreeBranch>
```

Then open the PR (see PR template below). **Nothing is committed or pushed until the user says
approve.** Subagents write and verify code only — they never commit.

**Surface spikes one at a time.** Even when multiple spikes complete simultaneously, present
them sequentially — finish all decisions for one spike before surfacing the next. Spike decisions
require focused discussion; parallel presentation leads to scattered context.

**For research-spike tasks**, the approval flow has an extra step before writing status:

### Step 0: Pre-research before surfacing

Before presenting any spike to the user, read the spike's `PROPOSED_SOLUTIONS` output and
identify open questions — risks, tradeoffs, or implementation constraints the user will likely ask
about. Dispatch those as background research subagents immediately, so findings arrive while the
user is reading the proposal. Do NOT wait for the user to ask before researching.

Common pre-research questions to anticipate:
- "What are the risks of approach X cascading to other marks?" → audit subagent
- "What are the options for Y behavior?" → research subagent with 2-3 concrete options
- "Can Vega do Z?" → targeted Vega capability subagent

**The orchestrator never reads files or writes code to answer follow-up questions.** All research
goes to background subagents. If the user asks a question the orchestrator cannot answer from
the spike doc alone, say "let me have a subagent look at that" and dispatch one.

### Step 1: Surface decisions one sub-question at a time

A spike often has multiple independent decisions (e.g. reusability approach, collision handling,
positioning). Do NOT present all decision points at once. Surface them sequentially:
1. Present the first decision point and wait for user response
2. While waiting, dispatch background research for the next decision point if needed
3. After user responds, confirm the decision and move to the next sub-question
4. Repeat until all decisions are resolved

### Step 2: Check for immediate reclassification

After the user resolves all decisions, explicitly ask: **"Is this spike's conclusion
straightforward enough to implement now, or does it need a separate ticket?"**

If the spike concluded "this is a `new-prop` / `new-child-component` / `bug-fix`" and the user
wants to proceed immediately, reclassify: create the worktree and dispatch an implementation
subagent using the appropriate skill, injecting the spike decisions as "## Context from dependent
spike." Do not wait for a separate batch dispatch.

### Step 3: Write the spike doc

After the user resolves all decisions, write `planning/<epic-key>/spikes/<task-id>.md`:

1. After the user selects a solution (or gives a custom direction), write
   `planning/<epic-key>/spikes/<task-id>.md`:

   ```markdown
   # Spike: <task title> (<task-id>)

   ## Proposed Solutions
   <paste all PROPOSED_SOLUTIONS from agent output, formatted as sections>

   ## Decision
   **Chosen approach:** <solution name or custom direction>
   **Rationale:** <user's stated reason, or "user accepted agent recommendation" if none given>

   ## Prototype
   **File:** <PROTOTYPE_PATH>
   **Implementation skill:** <IMPLEMENTATION_SKILL>

   ## Next Steps
   Any implementation task that depends on this spike should use the chosen approach above.
   Inject this file's "Decision" section into the dependent task's prompt under
   "## Context from dependent spike".
   ```

2. Then proceed with the normal approve flow (status file, push, PR).

### Step 4: Unblocked implementation check (after all spikes in a sub-batch are decided)

After all spikes in the current sub-batch have been decided (all `status: decided` in
`spikes.json`), check the manifest for any implementation tasks whose only dependencies are now
resolved spikes. These tasks are now unblocked.

Present the unblocked list to the user:

```
## Unblocked implementations ready to dispatch

The following tasks are unblocked now that <task-id> and <task-id> spikes are decided:

| Task | Type | Description |
|------|------|-------------|
| AN-XXXXX | new-prop | <changeDescription> |

Dispatch these now alongside the next sub-batch, or hold for their scheduled batch?
```

If the user says dispatch now: create worktrees, inject the spike decision doc as "## Context from
dependent spike", and dispatch immediately. Update `spikes.json` → `impl_dispatched` for each.

If the user says hold: note the pending tasks and dispatch them at their scheduled batch position.

**Do not silently accumulate undispatched implementations.** Every resolved spike must either
trigger an immediate dispatch or an explicit "hold" decision from the user. Never leave a decided
spike in `decided` state without a follow-up plan.

**On approve** (non-spike), after writing the status file:
1. Push the branch:
   ```bash
   git -C /tmp/epic-<epic-key>/<task-id> push origin <worktreeBranch>
   ```
2. Create a PR against `main`:
   ```bash
   gh pr create \
     --title "[<task-id>] <ticket title>" \
     --base main \
     --head <worktreeBranch> \
     --body "$(cat <<'EOF'
   ## Description
   <SUMMARY from agent result>

   ## Related Issue
   Jira: <task-id> (<epic-key>)

   ## Motivation and Context
   <1-2 sentences on why this change is needed — from the ticket description>

   ## How Has This Been Tested?
   - Unit tests updated and passing
   - Storybook story added: <story path>
   - Build and TSC verified clean (pre-existing TSC errors excluded)

   ## Screenshots (if appropriate):

   ## Types of changes
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to change)

   ## Checklist:
   - [ ] I have signed the [Adobe Open Source CLA](https://opensource.adobe.com/cla.html).
   - [ ] My code follows the code style of this project.
   - [ ] My change requires a change to the documentation.
   - [ ] I have updated the documentation accordingly.
   - [ ] I have read the **CONTRIBUTING** document.
   - [x] I have added tests to cover my changes.
   - [x] All new and existing tests passed.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```
3. Report the PR URL to the user.

**Do not auto-approve anything.** Even if the result looks clean, present it and wait. The user
may have domain knowledge that changes the assessment (e.g. a "simple" spike finding that would
actually break charts, a build failure the agent attributed to pre-existing issues but isn't).

**Present one result at a time.** Even when multiple agents complete simultaneously, present
them one at a time — wait for the user's decision on each before presenting the next. This keeps
decisions focused and prevents context overload.

**Worktree setup may run in parallel with running agents** (it is additive-only git work), but
**agent dispatch for the next sub-batch must wait** until the user has approved all results from
the current sub-batch.

### Batch Advance Gate — hard stop

Before dispatching any agent in sub-batch N+1, verify ALL of the following for sub-batch N:
- Every agent has returned an AGENT-RESULT
- Every result has been presented to the user
- Every result has received an explicit user decision (approve / retry / skip / needs-change)
- All approved results have been committed and pushed by the orchestrator

If any of these conditions is unmet, do not proceed. Say: "Waiting on approval for <task-id>
before starting the next sub-batch." There are no exceptions — not for independent tasks, not for
spikes, not for urgency. The user controls batch advance.

---

## Phase 5: Escalation Review

Escalations are surfaced as part of the completion check-in above (Phase 4). When a result
contains escalations, include them in the check-in presentation:

```
## Escalation: <task-id> — <task title>
**Question:** <question>
**Context:** <context>
**Options:**
  1. <option A> — tradeoff: <...>
  2. <option B> — tradeoff: <...>
**Agent recommendation:** <recommendation>

Your decision: [enter 1, 2, or custom answer]
```

After the user responds, write `planning/<epic-key>/escalations/<task-id>.md` with the question
and the decision. If the decision changes the implementation (not just confirms the best guess),
re-dispatch the agent with:
- The original task prompt
- The escalation question and the user's decision
- Instruction to find the `// ESCALATION(<task-id>):` comment(s) and revise accordingly

Other agents in the same sub-batch may continue running while the user reviews escalations —
but do not dispatch the *next* sub-batch until all current results are approved.

---

## Phase 6: Conflict Resolution Agent

After all batches complete, spawn a single conflict resolver agent (no worktree isolation needed —
it only reads, it does not write code).

Provide it with:
- The list of all worktree branches and their `FILES_CHANGED` lists from the status files
- The hotspot file table from Phase 3

**Conflict resolver instructions:**

For each hotspot file touched by more than one worktree:
1. Use `git diff <branch1>..<branch2> -- <file>` to compare the changes
2. Determine if the changes are additive (each adds a new case/import/export — likely
   automatically mergeable) or structural (each modifies the same function or line — needs
   manual resolution)
3. For additive conflicts: note that standard merge will handle them if done in order
4. For structural conflicts: identify which worktree should be the resolution target and what
   the manual merge step is

Produce a `planning/<epic-key>/conflict-report.md`:

```markdown
# Conflict Report — <epic-key>

## Recommended Review Order
1. <branch> — <why first>
2. <branch> — <why second>
...

## Hotspot File Status

| File | Worktrees | Conflict Type | Action |
|------|-----------|---------------|--------|
| chartSpecBuilder.ts | rsc-124, rsc-127 | Additive (each adds a new case) | Merge rsc-124 first; rsc-127 will need rebase |
| ... | | | |

## Manual Resolution Required
<List any structural conflicts with specific instructions>
```

---

## Phase 7: Final Summary

Write the outcome back into the planning directory.

For each task, update `planning/<epic-key>/tasks/<task-id>.md` by appending:

```markdown
---

## Implementation Outcome

**Status:** completed | needs-human-input | skipped
**Branch:** epic/rsc-123/<task-id>
**Worktree:** <path returned by isolation: "worktree">
**Storybook port:** <port>
**Files changed:** <list>
**Stories added:** <list>
**Escalations:** <none | link to escalations/<task-id>.md>

### Summary
<SUMMARY from agent result>
```

Write `planning/<epic-key>/summary.md`:

```markdown
# Epic <EPIC-KEY> — Implementation Summary

Generated: <timestamp>

## Status by Task

| Task | Title | Type | Status | Branch |
|------|-------|------|--------|--------|
| RSC-124 | ... | new-prop | completed | epic/rsc-123/rsc-124 |

## Next Steps for Manual Review

Review and merge worktrees in this order (from conflict report):
1. ...

## Open Escalations
<List any unresolved questions with their markdown file paths>

## Skipped Tasks
<List any spike tasks deferred due to missing skill>
```

Present the summary to the user and confirm they have everything they need to begin manual review.

---

## Skill Reference

| Task type | Skill file |
|---|---|
| `new-mark` | `.claude/commands/implement-new-chart-mark.md` |
| `new-child-component` | `.claude/commands/implement-new-child-component.md` |
| `new-prop` | `.claude/commands/implement-new-prop.md` |
| `bug-fix` | `.claude/commands/implement-bug-fix.md` |
| `research-spike` | `.claude/commands/implement-research-spike.md` |
