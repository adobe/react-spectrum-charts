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
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'React Spectrum Charts',
  tagline: 'Declarative library for composing Spectrum visualizations in React',
  favicon: 'https://www.adobe.com/favicon.ico',

  // Set the production url of your site here
  url: 'https://opensource.adobe.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/react-spectrum-charts/docs/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/adobe/react-spectrum-charts/tree/main/packages/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'React Spectrum Charts',
      logo: {
        alt: 'React Spectrum Charts Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/adobe/react-spectrum-charts',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/adobe/react-spectrum-charts/discussions',
            },
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/react-spectrum-charts',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/adobe/react-spectrum-charts',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Adobe. / <a href="https://www.adobe.com/privacy.html">Privacy</a> / <a href="https://www.adobe.com/legal/terms.html">Terms of Use</a> / <a href="https://www.adobe.com/privacy/cookies.html">Cookies</a> / <a href="https://www.adobe.com/privacy/ca-rights.html">Do Not Sell My Personal Information</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
