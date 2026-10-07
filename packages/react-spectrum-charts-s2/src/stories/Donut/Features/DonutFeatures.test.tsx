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
import { findChart, render, screen } from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { HideDeemphasizedLabels } from './DonutFeatures.story.js';

describe('Donut features', () => {
  test('HideDeemphasizedLabels hides de-emphasized segment labels', async () => {
    render(<HideDeemphasizedLabels {...HideDeemphasizedLabels.args} />);
    expect(await findChart()).toBeInTheDocument();
    expect(screen.queryByText('8.3K')).not.toBeInTheDocument();
  });

  test('de-emphasized segment labels render when hideDeemphasizedLabels is false', async () => {
    render(<HideDeemphasizedLabels {...HideDeemphasizedLabels.args} hideDeemphasizedLabels={false} />);
    expect(await findChart()).toBeInTheDocument();
    expect(await screen.findByText('8.3K')).toBeInTheDocument();
  });
});
