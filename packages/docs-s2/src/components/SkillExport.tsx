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

import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';

import { ActionButton, Provider, Text } from '@react-spectrum/s2';
import Copy from '@react-spectrum/s2/icons/Copy';
import Download from '@react-spectrum/s2/icons/Download';

import styles from './SkillExport.module.css';

type Status = 'idle' | 'done' | 'failed';

interface SkillExportProps {
  name: string;
  description: string;
}

const getMarkdownUrl = () => `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}.md`;

const getSkill = async (name: string, description: string) => {
  const response = await fetch(getMarkdownUrl());
  if (!response.ok) throw new Error(`Failed to fetch ${response.url}`);
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${await response.text()}`;
};

const SkillExportButtons = ({ name, description }: SkillExportProps) => {
  const { colorMode } = useColorMode();
  const [copyStatus, setCopyStatus] = useState<Status>('idle');
  const [downloadStatus, setDownloadStatus] = useState<Status>('idle');

  const run = async (action: () => Promise<void>, setStatus: (status: Status) => void) => {
    try {
      await action();
      setStatus('done');
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 2000);
  };

  const copySkill = () =>
    run(async () => navigator.clipboard.writeText(await getSkill(name, description)), setCopyStatus);

  const downloadSkill = () =>
    run(async () => {
      const url = URL.createObjectURL(new Blob([await getSkill(name, description)], { type: 'text/markdown' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SKILL.md';
      link.click();
      URL.revokeObjectURL(url);
    }, setDownloadStatus);

  const copyLabel = { idle: 'Copy as skill', done: 'Copied', failed: 'Copy failed' }[copyStatus];
  const downloadLabel = { idle: 'Download skill', done: 'Downloaded', failed: 'Download failed' }[downloadStatus];

  return (
    <Provider colorScheme={colorMode} UNSAFE_className={styles.actions}>
      <ActionButton size="S" onPress={copySkill}>
        <Copy />
        <Text>{copyLabel}</Text>
      </ActionButton>
      <ActionButton size="S" onPress={downloadSkill}>
        <Download />
        <Text>{downloadLabel}</Text>
      </ActionButton>
    </Provider>
  );
};

/** Copy-as-skill and download-skill buttons that export the current page as an agent SKILL.md. */
export const SkillExport = (props: SkillExportProps) => (
  <BrowserOnly>{() => <SkillExportButtons {...props} />}</BrowserOnly>
);

export default SkillExport;
