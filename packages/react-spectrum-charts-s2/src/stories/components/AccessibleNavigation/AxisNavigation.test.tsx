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
import { fireEvent } from '@testing-library/react';

import { findChart, render, waitFor } from '../../../test-utils';
import { Categorical } from './AxisNavigation.story';

test('axis navigation focuses a visible categorical label', async () => {
  render(<Categorical {...Categorical.args} />);
  const chart = await findChart();
  const container = chart.closest('.rsc-container') as HTMLElement;
  await waitFor(() => expect(container.querySelector('button')).toBeTruthy());
  (container.querySelector('button') as HTMLButtonElement).click();
  await waitFor(() => expect(container.querySelector('.dn-node')).toBeTruthy());

  const root = container.querySelector('.dn-node') as HTMLElement;
  fireEvent.keyDown(root, { key: 'ArrowRight', code: 'ArrowRight' });

  await waitFor(() => expect(container.querySelector('.dn-axis-focus-ring')).toHaveStyle({ display: 'block' }));
});