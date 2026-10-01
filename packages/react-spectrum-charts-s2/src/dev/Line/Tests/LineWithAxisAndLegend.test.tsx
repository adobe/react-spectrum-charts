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
import { render, screen, within } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock';
import { LineWithAxisAndLegend } from './LineWithAxisAndLegend.story';

describe('Line', () => {
  test('Line with axis and legend renders', async () => {
    render(<LineWithAxisAndLegend {...LineWithAxisAndLegend.args} />);
    expect(await screen.findByText('Add Fallout')).toBeInTheDocument();
    expect(await screen.findByText('Users')).toBeInTheDocument();
    expect(await screen.findByText('Nov')).toBeInTheDocument();
    const graphicsObjects = await screen.findAllByRole('graphics-object');
    expect(graphicsObjects.length).toEqual(3);
    const lineGroup = graphicsObjects[1];
    const lines = await within(lineGroup).findAllByRole('graphics-symbol');
    expect(lines.length).toEqual(4);
    expect(lines[0]).toBeInTheDocument();
  });
});
