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
import { render, screen } from '../../test-utils';
import { S2DonutSummary } from './S2DonutSummary.story';

describe('s2 styling', () => {
  test('summary value should have font-weight 800 when s2 is true', async () => {
    render(<S2DonutSummary {...S2DonutSummary.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('font-weight', '800');
  });

  test('summary label should have font-weight 700 when s2 is true', async () => {
    render(<S2DonutSummary {...S2DonutSummary.args} />);
    const metricLabel = await screen.findByText('Visitors');
    expect(metricLabel).toHaveAttribute('font-weight', '700');
  });
});
