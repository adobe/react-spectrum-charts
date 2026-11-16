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
import { ScatterSizeKey } from '../../../../lab/components/ScatterSizeKey/index.js';
import { findChart, render, screen } from '../../../../test-utils/index.js';
import { Basic } from './ScatterSizeKey.story.js';

describe('ScatterSizeKey', () => {
  // ScatterSizeKey is not a real React component. This is test just provides test coverage for sonarqube
  test('ScatterSizeKey pseudo element', () => {
    render(<ScatterSizeKey />);
  });

  test('shows the size key with its own title', async () => {
    render(<Basic {...Basic.args} />);
    expect(await findChart()).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Weight class')).toBeInTheDocument();
  });
});
