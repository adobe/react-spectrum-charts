# File a Bug Issue

Use when a bug has been identified but won't be fixed immediately. Investigates the root cause
and creates a structured issue doc in `planning/issues/`.

## Steps

1. **Clarify scope** — confirm the symptom, affected mark/hook/util, and what correct behavior
   looks like. Ask if unclear.

2. **Investigate** — spawn an Explore subagent to:
   - Find the relevant source files for the reported area
   - Read the encoding/logic for the affected behavior
   - Compare against similar working code (e.g. line mark vs. line points)
   - Note exact file paths and line numbers where the divergence is

3. **Write the issue doc** to `planning/issues/<kebab-case-title>.md`:
   - Status: Open
   - Symptom: 1-2 sentences
   - Root cause: technical, with file:line references
   - Comparison table if applicable (what working code does vs. buggy code)
   - Relevant files table
   - Proposed fix direction (not implementation)

4. **Do not implement the fix.** The goal is a clear, actionable record for later.
