# react-spectrum-charts: Implementation Plan

Use this command after a spike has validated an approach and it's time to plan the full implementation.
Given a Jira ticket key or URL in `$ARGUMENTS`, it fetches the ticket, researches the codebase,
classifies the change type, and proposes concrete implementation approaches with exact file paths
and function names — ready to hand off to an implementation skill.

**Arguments:** `$ARGUMENTS` — a Jira ticket key (e.g. `AN-450439`) or URL, optionally followed by
a plain-text description if you want to override or supplement the ticket content.

---

## Phase 1: Intake

### 1a: Parse ticket reference

Extract the ticket key from `$ARGUMENTS`. Accept any of:
- Bare key: `AN-450439`
- URL fragment: `...jira.../AN-450439`
- Key with description following it (use the key for fetch, description as supplement)

### 1b: Fetch ticket from Jira

Use `mcp__corp-jira__search_jira_issues` with JQL `key = <ticket-key>` to retrieve the ticket.
Include fields: summary, description, acceptance criteria, status, labels, components.

Also fetch comments with `mcp__corp-jira__get_jira_comments` — acceptance criteria and
implementation notes often appear in comments rather than the description.

If the Jira fetch fails or returns no results, ask the user to paste the ticket description and
acceptance criteria directly and continue.

### 1c: Extract and confirm scope

From the ticket content, extract:
- **Feature/behavior** — what should change in the rendered chart or public API
- **Acceptance criteria** — explicit success conditions (especially pixel values, token names,
  thresholds — use these verbatim, don't infer them)
- **Mark type** — which chart mark(s) are involved (Line, Bar, Area, Scatter, etc.)
- **S1 / S2 / both** — whether the change is for the s1 package, s2 package, or both

Confirm your understanding in 2–3 sentences before continuing.

---

## Phase 2: Research

Run these steps in parallel where possible.

### 2a: Read architecture context

Read `.claude/architecture.md` to load the render cycle, signal system, data pipeline, scale
conventions, and S2 parity rules into context. This is required before proposing any spec builder
change.

### 2b: Read relevant implementation skills

Classify the change and read the matching skill file(s):

| Change type | Skill file |
|---|---|
| New prop on an existing mark | `.claude/commands/implement-new-prop.md` |
| New component nested inside a mark | `.claude/commands/implement-new-child-component.md` |
| New top-level chart mark | `.claude/commands/implement-new-chart-mark.md` |
| Broken or incorrect behavior | `.claude/commands/implement-bug-fix.md` |

Read all that apply — some tickets combine a bug fix with a new prop.

### 2c: Explore affected code

Spawn an **Explore** subagent. Ask it to:
- Find the spec builder file(s) for the affected mark(s) (e.g. `lineSpecBuilder.ts`, `lineMarkUtils.ts`)
- Find the types file(s) for the affected mark(s) (e.g. `lineSpec.types.ts`)
- Find any existing utilities, signals, scales, or data transforms that are related to the feature
- Find the React component file(s) and Storybook story file(s) for the affected mark(s)
- If S2 is in scope, find the corresponding s2 files
- Report exact file paths and the key function/type names within them — not summaries

### 2d: Check for related prior work

Search for any spike artifacts or planning docs that might inform this implementation:
```
tmp/spikes/
planning/
```
If found, read them. A completed spike means an approach has already been validated — reference it
in the proposal.

---

## Phase 3: Classify

Based on Phases 1–2, state the change classification explicitly:

```
Change type: <New Prop | New Child Component | New Chart Mark | Bug Fix | combination>
Affected mark(s): <e.g. Line, Bar>
Packages in scope: <s1 | s2 | both>
Primary skill to follow: <file path>
```

Then list the **affected files** — every file that will need to change — grouped by layer:

```
Types
  packages/vega-spec-builder/src/types/marks/lineSpec.types.ts

Spec builder
  packages/vega-spec-builder/src/line/lineSpecBuilder.ts
  packages/vega-spec-builder/src/line/lineMarkUtils.ts   (if marks change)

Test fixtures
  packages/vega-spec-builder/src/line/lineTestUtils.ts

Unit tests
  packages/vega-spec-builder/src/line/lineSpecBuilder.test.ts
  packages/vega-spec-builder/src/line/lineMarkUtils.test.ts

React component
  packages/react-spectrum-charts/src/components/Line/Line.tsx

Storybook
  packages/react-spectrum-charts/src/stories/Line/<relevant story file>.story.tsx

S2 mirrors (if in scope)
  packages/vega-spec-builder-s2/src/...
  packages/react-spectrum-charts-s2/src/...
```

Omit any layer that is genuinely unaffected. Flag any file you are uncertain about.

---

## Phase 4: Propose

Present **2–3 concrete implementation approaches**. For each:

- **Name** — short label (e.g. "Signal-driven", "Data transform", "Encoding-only")
- **Summary** — 2–3 sentences: what it does, how it hooks into the pipeline, and why it is viable
- **Key changes** — for each affected file, one bullet describing what changes (function name,
  field name, encoding key) — specific enough that an engineer can start without reading the
  proposal twice
- **Tradeoffs** — complexity, reuse of existing patterns, risk, test burden
- **Acceptance criteria coverage** — explicitly map each acceptance criterion from the ticket to
  the approach, confirming it is met (or flagging if it is not)

If a prior spike validated one of these approaches, call that out and recommend it.

End with: **"Which approach would you like to implement?"** and wait for the user's response
before continuing to Phase 5.

---

## Phase 5: Implementation Plan

Once the user selects an approach, produce a **step-by-step implementation plan** — not code,
but a precise checklist of what to change and where.

Structure it as:

```
## Implementation Plan: <approach name>

### Step 1: Types  (<file path>)
- Add `<fieldName>: <type>` to `<InterfaceName>` — optional, JSDoc: "<description>"
- Add `'<fieldName>'` to `<InterfaceOptionsWithDefaults>` (only if it has a runtime default)

### Step 2: Spec builder  (<file path>)
- Destructure `<fieldName>` (default: <value>) in `add<Mark>`'s produce callback
- Add `<fieldName>` to the assembled `<mark>Options` object
- In `add<Marks>`: <what encoding or mark change to make>

### Step 3: Test fixtures  (<file path>)
- Add `<fixtureName>: <Mark>SpecOptions` fixture with `<fieldName>: <value>`

### Step 4: Unit tests  (<file path>)
- Test: "<describe block> > <test name>" — assert <what>
- Test: "<describe block> > <test name>" — assert <what>

### Step 5: React component  (<file path>)  [if needed]
- Add `<fieldName>?: <type>` to defaultProps / component signature with default <value>

### Step 6: Storybook story  (<file path>)
- Add story `<StoryName>` after `<ExistingStory>` — args: `{ <fieldName>: <value> }`

### Step 7: S2 mirrors  [if in scope]
- Repeat steps 1–6 for s2 packages, noting any s2-specific differences
```

After the plan, list the **test completeness checklist** from `CLAUDE.md` and confirm which items
apply to this change. Check off the ones the plan already covers; flag any that need attention.

End with: **"Ready to implement — use `/implement-new-prop` (or the matched skill) to start."**
