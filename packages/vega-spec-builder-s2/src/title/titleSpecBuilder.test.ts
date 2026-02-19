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
import { applyTitleOptionsDefaults } from './titleSpecBuilder';

describe('applyTitleOptionsDefaults()', () => {
  test('should always use S2 defaults', () => {
    const titleOptions = applyTitleOptionsDefaults({ text: 'Test Title' });
    expect(titleOptions).toHaveProperty('fontWeight', 700);
    expect(titleOptions).toHaveProperty('fontSize', 24);
    expect(titleOptions).toHaveProperty('position', 'start');
    expect(titleOptions).toHaveProperty('orient', 'top');
  });

  test('should respect custom options', () => {
    const titleOptions = applyTitleOptionsDefaults({
      text: 'Test Title',
      fontWeight: 'normal',
      position: 'end',
      orient: 'bottom',
    });
    expect(titleOptions).toHaveProperty('fontWeight', 'normal');
    expect(titleOptions).toHaveProperty('position', 'end');
    expect(titleOptions).toHaveProperty('orient', 'bottom');
  });
});
