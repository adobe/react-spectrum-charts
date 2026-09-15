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
const zlib = require('zlib');

function measure(distDir) {
  return fs
    .readdirSync(distDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(distDir, file));
      const gzip = zlib.gzipSync(raw, { level: 9 });
      return { fixture: file.replace(/\.js$/, ''), gzipKB: +(gzip.length / 1024).toFixed(1) };
    })
    .sort((a, b) => b.gzipKB - a.gzipKB);
}

// Exported so scripts/benchmark.js can reuse the same measurement without a subprocess.
module.exports = { measure };

if (require.main === module) {
  const full = process.argv.includes('--full');
  const distArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dist';
  const rows = measure(path.resolve(__dirname, '..', distArg));

  if (full) {
    console.table(rows);
  } else {
    // Compact by default: per-mark fixtures are consistently within ~1 KB gzip of each
    // other (proven repeatedly), so only the min (single-mark floor) and max (upper
    // bound, "everything") carry information. Keep this small — it gets run often.
    const min = rows[rows.length - 1];
    const max = rows[0];
    console.log(`${distArg}: min ${min.fixture}=${min.gzipKB}KB max ${max.fixture}=${max.gzipKB}KB (gzip)`);
  }
}
