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

import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, Legend, LegendProps, Prism } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';

export const LegendBarStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700 });
	return (
		<Prism {...prismProps}>
			<Bar color="series" />
			<Legend {...args} />
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
		</Prism>
	);
};

export const LegendBarHighlightedSeriesStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700, highlightedSeries: 'Mac' });
	return (
		<Prism {...prismProps}>
			<Bar color="series" />
			<Legend {...args} />
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
		</Prism>
	);
};

export const LegendBarHiddenSeriesStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700, hiddenSeries: ['Mac'] });
	return (
		<Prism {...prismProps}>
			<Bar color="series" />
			<Legend {...args} />
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
		</Prism>
	);
};

export const LegendDisconnectedStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700, height: 50 });
	return (
		<Prism {...prismProps}>
			<Legend {...args} />
		</Prism>
	);
};

export const defaultProps: LegendProps = {
	onClick: undefined,
};
