/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const findChart = async () => {
	return screen.findByRole('graphics-document');
};

export const hoverNthElement = async (elements: HTMLElement[], index: number) => {
	await userEvent.hover(elements[index]);
};

export const unhoverNthElement = async (elements: HTMLElement[], index: number) => {
	await userEvent.unhover(elements[index]);
};

export const clickNthElement = async (elements: HTMLElement[], index: number) => {
	await userEvent.click(elements[index]);
};

export const rightClickNthElement = async (elements: HTMLElement[], index: number) => {
	const user = userEvent.setup();
	await user.pointer([{ target: elements[index], keys: '[MouseRight]' }]);
};

export const allElementsHaveAttributeValue = (elements: HTMLElement[], attribute: string, value: number | string) =>
	elements.every((element) => element.getAttribute(attribute) === value.toString());
