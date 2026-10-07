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
import { getSpectrum2VegaConfig } from './spectrum2Theme.js';

describe('getSpectrum2VegaConfig', () => {
  test('anchors bottom and top legends at the start and left and right legends in the middle', () => {
    const layout = getSpectrum2VegaConfig('light').legend?.layout as Record<string, { anchor: string }>;
    expect(layout.bottom.anchor).toBe('start');
    expect(layout.top.anchor).toBe('start');
    expect(layout.left.anchor).toBe('middle');
    expect(layout.right.anchor).toBe('middle');
  });
});
