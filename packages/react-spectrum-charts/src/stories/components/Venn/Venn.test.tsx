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
import { Venn } from '../../../alpha';
import { allElementsHaveAttributeValue, clickNthElement, findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { Basic, WithLegend, WithPopover, WithToolTip } from './Venn.story';

describe('Venn', () => {
	test('Venn pseudo element', () => {
		render(<Venn />);
	});

	test('Basic renders properly without passing props', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();

		expect(chart).toBeInTheDocument();

		const circles = await findAllMarksByGroupName(chart, 'venn0');
		expect(circles.length).toEqual(2);

		const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');
		expect(intersections.length).toEqual(1);
	});

	test('WithLegend renders properly', async () => {
		render(<WithLegend {...WithLegend.args} />);
		const chart = await findChart();

		expect(chart).toBeInTheDocument();

		const circles = await findAllMarksByGroupName(chart, 'venn0');
		expect(circles.length).toEqual(4);

		const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');
		expect(intersections.length).toEqual(5);
	});

	describe('Popover', () => {
		test('should render a popover on click of circle', async () => {
			render(<WithPopover {...WithPopover.args} />);
			const chart = await findChart();
	
			expect(chart).toBeInTheDocument();
	
			const circles = await findAllMarksByGroupName(chart, 'venn0');
			expect(circles.length).toEqual(4);
	
			const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections')
			expect(intersections.length).toEqual(5);
	
			await clickNthElement(circles, 0);
			expect(circles[0]).toHaveAttribute('opacity', '0.5')
	
			// Check to make sure all circles after have lower opacity
			expect(
				allElementsHaveAttributeValue(circles.slice(1), 'opacity', '0.2')
			).toBeTruthy()
		})
	
		test('should render a popover on click of intersection', async () => {
			render(<WithPopover {...WithPopover.args} />);
			const chart = await findChart();
	
			expect(chart).toBeInTheDocument();
	
			const circles = await findAllMarksByGroupName(chart, 'venn0');
			expect(circles.length).toEqual(4);
	
			const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections')
			expect(intersections.length).toEqual(5);
	
			await clickNthElement(intersections, 0);
	
			console.log("Intersection attributes:", 
				Array.from(intersections[1].attributes)
				.map(attr => `${attr.name}="${attr.value}"`)
				.join(', ')
			);
	
	
			expect(intersections[0]).toHaveAttribute('fill-opacity', '0.7')
	
			// Check to make sure all circles after have lower opacity
			expect(
				allElementsHaveAttributeValue(intersections.slice(1), 'fill-opacity', '0')
			).toBeTruthy()
		})
	})
	
});
