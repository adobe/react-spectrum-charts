import React, { ReactElement } from 'react';

import { EmptyState } from '@components/EmptyState/EmptyState';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/EmptyState',
	component: EmptyState,
};

const EmptyStateStory: StoryFn<typeof EmptyState> = (args): ReactElement => {
	const { height } = args;
	return <EmptyState height={height}></EmptyState>;
};

const Basic = bindWithProps(EmptyStateStory);
Basic.args = { height: 500 };

export { Basic };
