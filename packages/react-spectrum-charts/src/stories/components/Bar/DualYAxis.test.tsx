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
import { findChart, render, screen } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { DualYAxis, WithThreeSeries } from './DualYAxis.story';

describe('Dual y axis bar axis styling', () => {
    describe('Two series', () => {
        test('axis title should have fill color based on series', async () => {
            render(<DualYAxis {...DualYAxis.args} />);
    
            const chart = await findChart();
            expect(chart).toBeInTheDocument();
    
            // set timeout
            await new Promise(resolve => setTimeout(resolve, 1000));
            // first axis uses first series color.
            expect(screen.getByText('Downloads')).toHaveAttribute('fill', 'rgb(15, 181, 174)');
            // second axis uses second series color.
            expect(screen.getByText('Mac Downloads')).toHaveAttribute('fill', 'rgb(64, 70, 202)');
        });
        test('axis label should have fill color based on series', async () => {
            render(<DualYAxis {...DualYAxis.args} />);
    
            const chart = await findChart();
            expect(chart).toBeInTheDocument();
    
            // first axis
            expect(screen.getAllByText('0')[0]).toHaveAttribute('fill', 'rgb(15, 181, 174)');
            // second axis uses second series color.
            expect(screen.getAllByText('0')[1]).toHaveAttribute('fill', 'rgb(64, 70, 202)');
        });
    })

    describe('Three series', () => {
        test('axis title should have fill color based on series', async () => {
            render(<WithThreeSeries {...WithThreeSeries.args} />);
    
            const chart = await findChart();
            expect(chart).toBeInTheDocument();
    
            // first axis has more than one series. Use default color.
            expect(screen.getByText('Downloads')).toHaveAttribute('fill', 'rgb(34, 34, 34)');
            // second axis uses third series color.
            expect(screen.getByText('Other Downloads')).toHaveAttribute('fill', 'rgb(246, 133, 17)');
        });
        test('axis label should have fill color based on series', async () => {
            render(<WithThreeSeries {...WithThreeSeries.args} />);
    
            const chart = await findChart();
            expect(chart).toBeInTheDocument();
    
            const axisLabels = screen.getAllByText('0');

            // first axis has more than one series. Use default color.
            expect(axisLabels[0]).toHaveAttribute('fill', 'rgb(34, 34, 34)');
            // second axis uses third series color.
            expect(axisLabels[1]).toHaveAttribute('fill', 'rgb(246, 133, 17)');
        });
    })

});
