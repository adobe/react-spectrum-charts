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

export const basicBulletData = [
	{ graphLabel: 'Facebook', currentAmount: 390, target: 50 },
	{ graphLabel: 'X', currentAmount: 275, target: 200 },
	{ graphLabel: 'LinkedIn', currentAmount: 200, target: 250 },
	{ graphLabel: 'Snapchat', currentAmount: 250, target: 200 },
	{ graphLabel: 'Instagram', currentAmount: 300, target: 250 },
	{ graphLabel: 'WhatsApp', currentAmount: 375, target: 300 },
];

export const basicThresholdsData = [
	{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
	{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
	{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
];

export const basicThresholdConfigData = {
	thresholds: [120, 235],
	colors: ['rgb(234, 56, 41)', 'rgb(249, 137, 23)', 'rgb(21, 164, 110)'],
};
