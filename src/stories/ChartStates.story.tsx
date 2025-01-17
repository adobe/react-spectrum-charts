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
import { Chart } from '@rsc';
import { bindWithProps } from '@test-utils';

import { ChartBarStory } from './ChartBarStory';

export default {
	title: 'RSC/Chart/States',
	component: Chart,
};

const EmptyState = bindWithProps(ChartBarStory);
EmptyState.args = {
	animations: false,
	data: [],
	height: 500,
	emptyStateText: 'No data found',
};

const LoadingState = bindWithProps(ChartBarStory);
LoadingState.args = {
	animations: false,
	data: [],
	height: 500,
	loading: true,
};

export { EmptyState, LoadingState };
