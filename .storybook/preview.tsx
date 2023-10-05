import React from 'react';
import { addDecorator, addParameters } from '@storybook/react';
import { defaultTheme, Provider, View } from '@adobe/react-spectrum';
import { withPropsTable } from 'storybook-addon-react-docgen';
import { useDarkMode } from 'storybook-dark-mode';
import './storybook.css';

addDecorator((Story) => {
	const darkMode = useDarkMode();
	return (
		<Provider theme={defaultTheme} colorScheme={darkMode ? 'dark' : 'light'} locale="en-US" height="100vh">
			<View padding="size-300">
				<Story />
			</View>
		</Provider>
	);
});

// @ts-ignore
addDecorator(withPropsTable({}));

addParameters({
	actions: { argTypesRegex: '^on[A-Z].*' },
	controls: {
		expanded: true,
		matchers: {
			color: /(background|color)$/i,
		},
	},
	backgrounds: { disable: true },
});
