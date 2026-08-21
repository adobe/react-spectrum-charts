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
import { FOCUSED_DIMENSION, FOCUSED_ITEM, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';

import { getFocusedGroupOrItemMatchExpr } from './focusMatchUtils';

describe('getFocusedGroupOrItemMatchExpr()', () => {
  test('matches on either the focused dimension directly or a focused item that belongs to this group', () => {
    expect(getFocusedGroupOrItemMatchExpr('datum.series')).toBe(
      `${FOCUSED_DIMENSION} === datum.series || (isValid(${FOCUSED_ITEM}) && indexof(${FOCUSED_ITEM}, datum.series + "${NAVIGATION_ID_SEPARATOR}") === 0)`
    );
  });

  test('works with an arbitrary match expression, not just datum.<field>', () => {
    expect(getFocusedGroupOrItemMatchExpr('datum.value')).toContain('datum.value');
  });
});
