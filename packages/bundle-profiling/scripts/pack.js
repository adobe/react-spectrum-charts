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

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Packs @spectrum-charts/react-spectrum-charts-s2 with `npm pack` and extracts it into
// .pack/react-spectrum-charts-s2/, so the profiling harness can resolve against exactly
// what the `files` allowlist actually ships — not the live workspace source/symlink. This
// is what catches a file missing from `files` before a real consumer would.
const pkgDir = path.resolve(__dirname, '..', '..', 'react-spectrum-charts-s2');
const outDir = path.resolve(__dirname, '..', '.pack', 'react-spectrum-charts-s2');

function pack() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsc-pack-'));
  const tarballName = execFileSync('npm', ['pack', '--pack-destination', tmpDir], {
    cwd: pkgDir,
  })
    .toString()
    .trim()
    .split('\n')
    .pop();

  execFileSync('tar', ['-xzf', path.join(tmpDir, tarballName), '-C', tmpDir]);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(path.join(tmpDir, 'package'), outDir);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Fail loudly, now, if anything main/module/exports points at didn't make it into the
  // tarball — this is the exact failure mode this fixture exists to catch.
  const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
  const referenced = new Set();
  [pkg.main, pkg.module, pkg.browser].forEach((p) => p && referenced.add(p));
  const collectExportPaths = (node) => {
    if (typeof node === 'string') referenced.add(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(collectExportPaths);
  };
  collectExportPaths(pkg.exports);

  const missing = [...referenced].filter((rel) => !fs.existsSync(path.join(outDir, rel)));
  if (missing.length) {
    throw new Error(
      `Packed artifact is missing files referenced by package.json main/module/exports: ${missing.join(', ')}`
    );
  }

  return outDir;
}

module.exports = { pack, outDir };

if (require.main === module) {
  const dir = pack();
  console.log(`packed: ${dir}`);
}
