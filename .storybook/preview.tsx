import React from 'react';

import { DocsContainer } from '@storybook/addon-docs';
import { Decorator, Parameters, Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';

import { Provider, View, defaultTheme } from '@adobe/react-spectrum';

import './storybook.css';

const decorators: Decorator[] = [
	(Story) => {
		const darkMode = useDarkMode();
		return (
			<Provider theme={defaultTheme} colorScheme={darkMode ? 'dark' : 'light'} locale="en-US" height="auto">
				<View padding="size-300">
					<Story />
				</View>
			</Provider>
		);
	},
];

const parameters: Parameters = {
	actions: { argTypesRegex: '^on[A-Z].*' },
	controls: {
		expanded: true,
		// data is huge so we don't want to show it in the controls
		// exclude: ['data'],
	},
	backgrounds: { disable: true },
	docs: {
		container: (context: any) => {
			const isDark = useDarkMode();

			const props = {
				...context,
				theme: isDark ? themes.dark : themes.light,
			};

			return <DocsContainer {...props} />;
		},
	},
};

const preview: Preview = {
	decorators,
	parameters,
};

export default preview;
