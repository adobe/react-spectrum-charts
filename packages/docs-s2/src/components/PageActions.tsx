/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { useState } from 'react';

import { useColorMode } from '@docusaurus/theme-common';

import { ActionButton, Provider, Text } from '@react-spectrum/s2';
import Copy from '@react-spectrum/s2/icons/Copy';
import FileText from '@react-spectrum/s2/icons/FileText';

import styles from './PageActions.module.css';

const getMarkdownUrl = () => `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}.md`;

/**
 * Copy-for-LLM and View-as-Markdown buttons for the current doc page.
 * @param inSidebar stacks the actions above a divider, for the table of contents sidebar
 * @returns page actions element
 */
const PageActions = ({ inSidebar = false }: { inSidebar?: boolean }) => {
  const { colorMode } = useColorMode();
  const [copied, setCopied] = useState(false);

  const copyPage = async () => {
    const markdown = fetch(getMarkdownUrl())
      .then((response) => response.text())
      .then((text) => new Blob([text], { type: 'text/plain' }));
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': markdown })]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Provider colorScheme={colorMode} UNSAFE_className={inSidebar ? styles.sidebar : styles.actions}>
      <ActionButton size="S" isQuiet onPress={copyPage}>
        <Copy />
        <Text>{copied ? 'Copied' : 'Copy for LLM'}</Text>
      </ActionButton>
      <ActionButton size="S" isQuiet onPress={() => window.open(getMarkdownUrl(), '_blank', 'noopener')}>
        <FileText />
        <Text>View as Markdown</Text>
      </ActionButton>
    </Provider>
  );
};

export default PageActions;
