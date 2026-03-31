import React, { useEffect } from 'react';

import { DocsContainer } from '@storybook/addon-docs';
import { Decorator, Parameters, Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';

import { Provider, View, defaultTheme } from '@adobe/react-spectrum';

import './storybook.css';

const decorators: Decorator[] = [
  (Story) => {
    const darkMode = useDarkMode();

    useEffect(() => {
      const htmlElement = document.documentElement;
      if (darkMode) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
      } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
      }
    }, [darkMode]);

    return (
      <Provider theme={defaultTheme} colorScheme={darkMode ? 'dark' : 'light'} locale="en-US">
        <View padding={24} backgroundColor="gray-50">
          <Story />
        </View>
      </Provider>
    );
  },
];

const parameters: Parameters = {
  options: {
    storySort: (a, b) => {
      const aParts = a.title.split('/');
      const bParts = b.title.split('/');
      const minLen = Math.min(aParts.length, bParts.length);

      for (let i = 0; i < minLen; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i].localeCompare(bParts[i]);
        }
      }

      // Deeper title = folder, sort before flat/hoisted stories
      if (aParts.length !== bParts.length) {
        return bParts.length - aParts.length;
      }

      // Docs page always first within its group
      if (a.name === 'Docs') return -1;
      if (b.name === 'Docs') return 1;

      return a.name.localeCompare(b.name);
    },
  },
  controls: {
    expanded: true,
    // data is huge so we don't want to show it in the controls
    exclude: ['data'],
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
  actions: { argTypesRegex: '^on[A-Z].*' },
};

const preview: Preview = {
  decorators,
  parameters,
  tags: ['autodocs'],
};

export default preview;

