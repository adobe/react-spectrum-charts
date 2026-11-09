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
import { useMemo } from 'react';

import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { SkipToContentFallbackId } from '@docusaurus/theme-common/internal';

/**
 * Gets the doc's table of contents with a leading entry that links to the page title.
 * @returns toc items and front matter
 */
export const useTocWithTitle = () => {
  const { toc, metadata, frontMatter } = useDoc();
  const tocWithTitle = useMemo(
    () => [{ value: metadata.title, id: SkipToContentFallbackId, level: 2 }, ...toc],
    [toc, metadata.title]
  );
  return { toc: tocWithTitle, frontMatter };
};
