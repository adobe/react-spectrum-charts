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
import React from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { ThemeClassNames } from '@docusaurus/theme-common';
import TOC from '@theme/TOC';

import PageActions from '../../../../components/PageActions';
import { useTocWithTitle } from '../useTocWithTitle';
import styles from './styles.module.css';

/**
 * Desktop table of contents that with page actions above it.
 * @returns TOC element
 */
export default function DocItemTOCDesktop() {
  const { toc, frontMatter } = useTocWithTitle();
  return (
    <div className={styles.sidebar}>
      <BrowserOnly>{() => <PageActions inSidebar />}</BrowserOnly>
      <div className={styles.heading}>On this page</div>
      <TOC
        toc={toc}
        minHeadingLevel={frontMatter.toc_min_heading_level}
        maxHeadingLevel={frontMatter.toc_max_heading_level}
        className={`${ThemeClassNames.docs.docTocDesktop} ${styles.toc}`}
      />
    </div>
  );
}
