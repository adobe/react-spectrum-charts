---
description: Port a feature from react-spectrum-charts (v1) to S2 using a GitHub PR URL or PR number. Checks if the feature already exists in S2, and if not, migrates the implementation, creates stories, and runs tests.
argument-hint: "[github-pr-url-or-number]"
---

You are helping port a feature from `react-spectrum-charts` (v1) into `react-spectrum-charts-s2` (Spectrum 2).

The PR to migrate is: **$ARGUMENTS**

`$ARGUMENTS` may be either a full GitHub PR URL (e.g. `https://github.com/adobe/react-spectrum-charts/pull/123`) or a bare PR number (e.g. `123`). If `$ARGUMENTS` is empty, look for either form in the current conversation. If none is found, ask the user to provide one before proceeding.

Once you have the input, follow these phases in order:

---

### Phase 1 — Fetch the PR

Choose a source based on what was provided and what's available:

**Preferred path — GitHub MCP (only when both conditions hold):**
- The GitHub MCP is configured and responsive

Parse `owner`, `repo`, and `pull_number` from the URL, then in parallel:
- Call GitHub MCP `get_pull_request` to get the PR title, description, and base branch
- Call GitHub MCP `get_pull_request_files` to get every changed file and its patch/diff

If either MCP call errors or the MCP is not configured, fall back to the local git path below.

**Fallback path — local git commands + WebFetch for PR metadata:**

Use this path whenever any of the following is true:
- The GitHub MCP is not configured in this environment
- An MCP call failed or returned an error

Derive the PR number from the input (strip non-digits from a URL if needed), then run:

```bash
git fetch origin pull/<num>/head:pr-<num>
git log origin/main..pr-<num> --oneline         # commits on the PR
git diff --name-only origin/main...pr-<num>     # changed file list (note the three dots)
git diff origin/main...pr-<num>                 # full diff
```

Use `origin/main` rather than `main` — it always resolves after `git fetch`, even when no local `main` branch is checked out.

The three-dot `...` in the diff is important — it diffs against the merge base so you see only what the PR adds.

**If the PR is already merged into main**, the commands above return zero commits and an empty diff (the merge base has caught up to the PR head). In that case, find the merge commit and diff the PR's commit range directly:

```bash
git log --all --oneline --grep="#<num>"       # find the merge commit, e.g. "Merge pull request #<num>"
# From the PR branch, identify its oldest commit belonging to this PR as <first>:
git log pr-<num> --oneline | head -20
git log <first>^..pr-<num> --oneline          # PR-only commits
git diff --name-only <first>^...pr-<num>      # changed file list
git diff <first>^...pr-<num>                  # full diff
```

**Also attempt WebFetch on the constructed PR URL** to pull the title, description, and any details that git alone cannot see that may be helpful:

- Construct the URL as `https://github.com/adobe/react-spectrum-charts/pull/<num>` (use the URL directly if one was provided).
- Call `WebFetch` on that URL with a prompt like: "Extract the PR title and description/body"
- If WebFetch is unavailable or returns an error, proceed with git-only info and derive intent from the commit messages and diff.

Combine the WebFetch PR metadata (title, description, linked issues) with the git commit messages and diff to form a complete picture of the change.

Summarize the PR: what feature or change does it introduce?

---

### Phase 2 — Filter to RSC v1 Changes Only

From the list of changed, deleted, or new files, ignore anything already in S2 packages:
- Skip files in `packages/react-spectrum-charts-s2/`
- Skip files in `packages/vega-spec-builder-s2/`

Focus only on changes in:
- `packages/react-spectrum-charts/` (React layer)
- `packages/vega-spec-builder/` (spec builder logic)
- `packages/constants/` (shared constants, if applicable)

Categorize the changes: new component? new prop on an existing component? new story variant? new type definition? new spec builder function? This determines the migration scope.

---

### Phase 3 — Check if the Feature Already Exists in S2

For each changed v1 file, derive the S2 counterpart path by substituting the package name:
- `packages/react-spectrum-charts/src/X` → `packages/react-spectrum-charts-s2/src/X`
- `packages/vega-spec-builder/src/X` → `packages/vega-spec-builder-s2/src/X`

Use `Read` and `Grep` to check whether the S2 counterpart already contains the feature (prop, function, component, story, etc.).

**If the feature already exists in S2 across all changed files → report what was found and stop. Do not make any changes.**

---

### Phase 4 — Determine Migration Order

Plan the order of changes, always resolving dependencies first:
1. Types (`vega-spec-builder-s2/src/types/`)
2. Spec builder logic (`vega-spec-builder-s2/src/`)
3. React component/props (`react-spectrum-charts-s2/src/components/`)
4. Stories (`react-spectrum-charts-s2/src/stories/components/`)
5. Index/export files

Identify which files need to be **created** (brand new component) vs **edited** (new prop on existing component).

---

### Phase 5 — Confirm Structural Changes (if needed)

Before writing any code, assess whether the v1 implementation can be ported roughly as-is, or whether S2's architecture requires a fundamentally different approach (e.g. different component composition, different hook pattern, a prop shape that can't exist in S2, a spec builder pathway that is organized differently, etc.).

**If the port requires only minor adaptations** (import paths, story titles, direct v1→v2 component swaps), skip this phase and continue to Phase 6.

**If the port requires significant structural changes in S2** that diverge from the v1 implementation:
- Stop before making any code changes
- Briefly describe the big implementation differences to the user:
  - What the v1 approach does
  - Why the same approach doesn't work in S2
  - What the S2 implementation will look like instead (1–3 bullets)
- Ask the user to confirm they are OK with those changes before proceeding
- Do not proceed to Phase 6 until the user confirms

---

### Phase 6 — Apply the Migration

For each file to create or modify, follow this process:
- **Always read the existing S2 file first** (if it exists) before making any changes
- Apply the changes from the PR diff, keeping the code as close to the original as possible
- Make only the minimal adaptations required:
  - Package import paths (match whatever the S2 package uses)
  - Story title prefixes: `'React Spectrum Charts/<Name>'` → `'React Spectrum Charts 2/<Name>'`
  - Any Spectrum v1 component references that have a direct v2 equivalent
- If a v1 API has no direct v2 equivalent, flag it in the final report rather than guessing
- For new files, model the structure on the nearest existing S2 equivalent

**S2 story title conventions:**
- Examples stories: `title: 'React Spectrum Charts 2/<ComponentName>/Examples'`
- Feature stories (single): `title: 'React Spectrum Charts 2/<ComponentName>/Features'`
- Feature stories (grouped): `title: 'React Spectrum Charts 2/<ComponentName>/Features/<GroupName>'`

---

### Phase 7 — Run Tests

After applying all changes, run the tests for the affected S2 component using Bash:

```bash
yarn test --testPathPattern=<ComponentName>
```

If tests fail:
- Read the error output carefully
- Fix the issue in the relevant file
- Re-run the tests
- Repeat until all tests pass, or determine that manual intervention is needed and flag it

---

### Phase 8 — Port Documentation (if v1 docs exist)

After tests pass, check whether v1 has documentation covering this feature:
- Look in the PR's changed files for any docs touched or added (`.md`, `.mdx`, files under a `docs/` directory, or doc blocks on public APIs)
- Also use `Glob` / `Grep` inside `packages/react-spectrum-charts/` and `packages/vega-spec-builder/` to see if existing v1 documentation covers the affected component, prop, or function (e.g. a component README, prop tables, usage examples)

**If v1 has documentation for this feature:**
- Find the S2 counterpart location by substituting the package name (same path mapping as Phase 3)
- Port the documentation to S2, basing it on the v1 version
- Adjust any v1-specific references (package names, import paths, component names, story titles) to their S2 equivalents
- If the S2 doc file already exists, edit it; otherwise create it modeled on the nearest existing S2 doc

**If v1 has no documentation for this feature,** skip this phase and note it in the final report.

---

### Phase 9 — Launch Storybook

Start the S2 Storybook so the user can visually verify the ported story:

```bash
yarn storybook:s2
```

- Run it as a background process so the skill can keep going
- If the build fails or complains about stale artifacts, rebuild first (`yarn build` on the relevant packages) and retry
- Once Storybook is up, note the local URL it prints (typically `http://localhost:6006/`)
- Construct the deep link to the newly ported story using its title path, e.g.:
  - `http://localhost:6006/?path=/story/react-spectrum-charts-2-<component>-features--<story-id>`
  - Lowercase and hyphenate the title segments to match Storybook's story ID format

**If you have browser/navigation tools available** (e.g. a Playwright or browser MCP), open the URL and confirm the story renders without console errors. Capture any runtime issues and flag them in the final report.

**If you do not have browser tools available,** print the URL clearly and ask the user to open it to verify the story.

---

### Phase 10 — Report

Provide a structured summary:

**PR Summary**
- What feature or change the PR introduced

**Migration Applied**
- Every file created or modified, with a one-line description of what changed

**Structural Changes** *(if any)*
- Any S2-specific implementation changes that diverged from v1 and were confirmed with the user

**Test Results**
- Whether tests passed, and any fixes applied during the test run

**Documentation**
- Docs ported from v1 (and their S2 location), or a note that v1 had no docs for this feature

**Storybook**
- Local Storybook URL and a direct link to the ported story
- Whether the story was visually verified (by you or pending user check) and any runtime issues observed

**Manual Follow-up Needed** *(if any)*
- v1 APIs with no direct v2 equivalent
- Any parts of the migration that could not be applied automatically
