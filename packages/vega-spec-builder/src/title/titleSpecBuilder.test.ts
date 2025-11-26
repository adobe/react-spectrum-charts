/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { DEFAULT_TITLE_FONT_WEIGHT } from '@spectrum-charts/constants';

import { applyTitleOptionsDefaults } from './titleSpecBuilder';

describe('applyTitleOptionsDefaults()', () => {
  test('should use base defaults', () => {
    const titleOptions = applyTitleOptionsDefaults({ text: 'Test Title' });
    expect(titleOptions).toHaveProperty('fontWeight', DEFAULT_TITLE_FONT_WEIGHT);
    expect(titleOptions).toHaveProperty('position', 'middle');
    expect(titleOptions).toHaveProperty('orient', 'top');
  });

  test('should use s2 defaults if s2 is true', () => {
    const titleOptions = applyTitleOptionsDefaults({ text: 'Test Title', s2: true });
    expect(titleOptions).toHaveProperty('position', 'start');
  });

  test('should respect options', () => {
    const titleOptions = applyTitleOptionsDefaults({
      text: 'Test Title',
      fontWeight: 'normal',
      position: 'start',
      orient: 'bottom',
    });
    expect(titleOptions).toHaveProperty('fontWeight', 'normal');
    expect(titleOptions).toHaveProperty('position', 'start');
    expect(titleOptions).toHaveProperty('orient', 'bottom');
  });
});
