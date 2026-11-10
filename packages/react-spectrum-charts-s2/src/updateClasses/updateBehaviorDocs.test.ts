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
import fs from 'fs';
import path from 'path';

import { getUpdateBehaviorDocs } from './updateBehaviorDocs.js';
import { UPDATE_CLASS_REGISTRY } from './updateClassRegistry.js';

const DOCS_PAGE = path.resolve(__dirname, '../../../docs-s2/docs/update-behavior.mdx');

describe('Update behavior docs', () => {
  test('should match the update class tables', () => {
    const docs = getUpdateBehaviorDocs(UPDATE_CLASS_REGISTRY);
    if (process.env.UPDATE_BEHAVIOR_DOCS) {
      fs.writeFileSync(DOCS_PAGE, docs);
    }
    // regenerate with `yarn docs:update-behavior`
    expect(fs.readFileSync(DOCS_PAGE, 'utf8')).toBe(docs);
  });
});
