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
import React, { ReactElement, ReactNode } from 'react';

// The only allowed BrowserOnly import; everything else goes through ClientOnly so the Markdown export stays complete.
// eslint-disable-next-line no-restricted-imports
import BrowserOnly from '@docusaurus/BrowserOnly';

/** Content that is hidden on the page but kept in the page's Markdown export for agents. */
export const MarkdownOnly = ({ children }: { children: ReactNode }) => (
  <div hidden data-markdown-only>
    {children}
  </div>
);

/** Content shown on the page but left out of the page's Markdown export, like drag instructions. */
export const WebOnly = ({ children }: { children: ReactNode }) => <div data-web-only>{children}</div>;

type ClientOnlyProps = {
  children: () => ReactNode;
  fallback?: ReactElement;
} & (
  | {
      /** What the Markdown export shows in place of the client-only content: its code, data, or values. */
      markdown: ReactElement;
    }
  | {
      markdown: null;
      /** Why the content needs nothing in the Markdown export, e.g. page chrome or a code block already shown. */
      noMarkdownReason: string;
    }
);

/**
 * Renders content in the browser only, plus what the page's Markdown export shows in its place.
 * @param props
 * @returns client-only element with its Markdown equivalent
 */
export const ClientOnly = (props: ClientOnlyProps) => (
  <>
    <BrowserOnly fallback={props.fallback}>{props.children}</BrowserOnly>
    {props.markdown && <MarkdownOnly>{props.markdown}</MarkdownOnly>}
  </>
);
