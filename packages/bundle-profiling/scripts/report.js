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

const distDir = path.resolve(__dirname, '..', process.argv[2] || 'dist');

const rows = fs
  .readdirSync(distDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const raw = fs.readFileSync(path.join(distDir, file));
    const gzip = zlib.gzipSync(raw, { level: 9 });
    return {
      fixture: file.replace(/\.js$/, ''),
      'raw KB': +(raw.length / 1024).toFixed(1),
      'gzip KB': +(gzip.length / 1024).toFixed(1),
    };
  })
  .sort((a, b) => b['gzip KB'] - a['gzip KB']);

console.log('\nCold-consumer bundle cost (peer dependencies included, per fixture, standalone):\n');
console.table(rows);
