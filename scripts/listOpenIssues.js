#!/usr/bin/env node
/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Lists open (not-yet-implemented) bug issue specs with only the fields
 * bug-summary.md's report line actually uses (id/title/chartType/variant/
 * complexity for the bolded header, symptom/rootCause/openQuestions for the
 * summary sentence), plus title for human scanning. Skips summary/comparison
 * (redundant with the more detailed symptom/rootCause — fetch summary
 * directly from the full file if it seems relevant to confirm something),
 * status (near-constant — every file here is an open, unreviewed spec, so
 * it's always "approved"), and the bulky
 * implementationPlan/edgeCases/crossCutting/designTokens/references.
 *
 * Covers two spec locations: the standard planning/specs/<chartType>/issues/
 * convention, and planning/specs/github-issues/ — a flat staging area (no
 * issues/ subfolder) that mixes bug and feature specs together, so it's
 * filtered by kind here rather than by directory structure.
 *
 * Usage:
 *   node scripts/listOpenIssues.js [chartType]
 *
 * Output:
 *   JSON array to stdout, sorted ascending by file path, each entry numbered
 *   sequentially from 1 in that same order.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const SPECS_DIR = path.join(__dirname, '../planning/specs');
const chartTypeFilter = process.argv[2];

/**
 * Finds every issues/*.json file directly under a chartType dir, excluding implemented/
 * (a subdirectory name never ends in .json, so a plain, non-recursive readdir already
 * excludes it).
 * @param {string} dir
 * @returns {string[]}
 */
function findChartTypeIssueFiles(dir) {
  const issuesDir = path.join(dir, 'issues');
  if (!fs.existsSync(issuesDir)) return [];
  return fs
    .readdirSync(issuesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(issuesDir, f));
}

const chartTypeDirs = fs
  .readdirSync(SPECS_DIR)
  .map((f) => path.join(SPECS_DIR, f))
  .filter((f) => fs.statSync(f).isDirectory() && path.basename(f) !== 'github-issues');

const githubIssuesDir = path.join(SPECS_DIR, 'github-issues');
const githubIssueFiles = fs.existsSync(githubIssuesDir)
  ? fs
      .readdirSync(githubIssuesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(githubIssuesDir, f))
  : [];

const files = [...chartTypeDirs.flatMap(findChartTypeIssueFiles), ...githubIssueFiles].map((f) =>
  path.relative(process.cwd(), f)
);

const entries = files
  .map((file) => ({ file, spec: JSON.parse(fs.readFileSync(file, 'utf-8')) }))
  .filter(({ spec }) => spec.kind === 'bug')
  .filter(({ spec }) => !chartTypeFilter || spec.chartType === chartTypeFilter)
  .sort((a, b) => a.file.localeCompare(b.file))
  .map(({ file, spec }, i) => ({
    n: i + 1,
    file,
    id: spec.id,
    title: spec.title,
    chartType: spec.chartType,
    variant: spec.variant,
    complexityScore: spec.complexity?.score,
    symptom: spec.symptom,
    rootCause: spec.rootCause,
    openQuestions: spec.openQuestions,
  }));

process.stdout.write(JSON.stringify(entries));
