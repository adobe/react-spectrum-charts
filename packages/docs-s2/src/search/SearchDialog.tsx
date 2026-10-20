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
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import { useHistory } from '@docusaurus/router';
import { useColorMode } from '@docusaurus/theme-common';
import { usePluginData } from '@docusaurus/useGlobalData';

import {
  ActionButton,
  Card,
  CardPreview,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Heading,
  Keyboard,
  Provider,
  SearchField,
  Text,
} from '@react-spectrum/s2';
import SearchIcon from '@react-spectrum/s2/icons/Search';

import { docs } from '../components/PropsTable';
import { Stage, StageLabelBadge, getStageLabel, isStage } from '../components/StageBadge';
import { DocsChart } from '../components/examples/DocsChart';
import styles from './SearchDialog.module.css';
import { ChartExample, chartExamples } from './chartExamples';

interface SearchHeading {
  text: string;
  id: string;
  level: number;
}

interface SearchPage {
  id: string;
  title: string;
  description: string;
  stage?: string;
  headings: SearchHeading[];
}

interface SectionResult {
  key: string;
  title: string;
  context: string;
  href: string;
  /** Stage of the result's page. */
  stage?: Stage;
  /** Whether the query matches the title, not just the context. */
  isTitleMatch: boolean;
}

const getPageStage = (pages: SearchPage[], docId: string): Stage | undefined => {
  const stage = pages.find((page) => page.id === docId)?.stage;
  return isStage(stage) ? stage : undefined;
};

const DRAW_IN: 'drawIn'[] = ['drawIn'];
const NO_ANIMATION: [] = [];
const MAX_SECTIONS = 12;

const tokenize = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);
const matches = (tokens: string[], text: string) => {
  const haystack = text.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
};

/**
 * Maps doc ids to permalinks.
 * @returns record of doc id to path
 */
const useDocPaths = (): Record<string, string> => {
  const allDocs = useAllDocsData();
  return useMemo(() => {
    const paths: Record<string, string> = {};
    for (const plugin of Object.values(allDocs)) {
      for (const doc of plugin.versions[0]?.docs ?? []) paths[doc.id] = doc.path;
    }
    return paths;
  }, [allDocs]);
};

/**
 * Chart card; draws in only the first time it appears while the dialog is open.
 * @param example
 * @param href
 * @param stage page stage
 * @param seen doc ids of cards already shown in this dialog session
 * @returns Card element
 */
const ExampleCard = ({
  example,
  href,
  stage,
  seen,
}: {
  example: ChartExample;
  href: string;
  stage?: Stage;
  seen: Set<string>;
}) => {
  const [drawIn] = useState(() => !seen.has(example.docId));
  useEffect(() => {
    seen.add(example.docId);
  }, [seen, example.docId]);

  return (
    <Card
      href={href}
      size="S"
      textValue={example.title}
      UNSAFE_className={styles.card}
      UNSAFE_style={{ width: '100%', height: 'auto' }}
    >
      <Content>
        <div className={styles.cardTitle}>
          <Text slot="title">{example.title}</Text>
          {stage && <StageLabelBadge stage={stage} />}
        </div>
      </Content>
      <CardPreview>
        <div className={styles.preview} aria-hidden>
          <DocsChart data={example.data} width="100%" height="100%" animationTypes={drawIn ? DRAW_IN : NO_ANIMATION}>
            {example.marks}
          </DocsChart>
        </div>
      </CardPreview>
    </Card>
  );
};

/**
 * Lists component props as section results, linked to the component's API heading.
 * @param tokens
 * @param page
 * @param components
 * @param getHref
 * @returns prop results
 */
const getPropResults = (
  tokens: string[],
  page: SearchPage,
  components: string[],
  getHref: (docId: string, anchor?: string) => string
): SectionResult[] =>
  components.flatMap((component) => {
    const apiHeading = page.headings.findLast(
      ({ text }) => text === component || text.startsWith(`${component} props`)
    );
    return (docs[component]?.props ?? [])
      .filter(({ name }) => matches(tokens, `${component} ${name}`) && matches(tokens.slice(-1), name))
      .map(({ name }) => ({
        key: `${page.id}:${component}.${name}`,
        title: name,
        context: `${component} prop`,
        href: getHref(page.id, apiHeading?.id),
        stage: isStage(page.stage) ? page.stage : undefined,
        isTitleMatch: true,
      }));
  });

/**
 * Search field, matching doc sections, and matching chart cards.
 * @param onNavigate called with a result's path
 * @param onClose closes the dialog
 * @returns dialog body
 */
const SearchResults = ({ onNavigate, onClose }: { onNavigate: (href: string) => void; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const seen = useRef(new Set<string>()).current;
  const { pages } = usePluginData('docs-s2-search') as { pages: SearchPage[] };
  const docPaths = useDocPaths();
  const tokens = tokenize(query);

  // Mounted for the dialog's whole lifetime, including its exit animation, so the navbar fades with the page.
  useEffect(() => {
    document.documentElement.setAttribute('data-docs-search-open', '');
    return () => document.documentElement.removeAttribute('data-docs-search-open');
  }, []);

  const getHref = (docId: string, anchor?: string) => {
    const hash = anchor ? '#' + anchor : '';
    return (docPaths[docId] ?? '') + hash;
  };

  const cards = chartExamples.filter((example) => matches(tokens, `${example.title} ${example.keywords}`));

  const sections: SectionResult[] = pages.flatMap((page) => {
    const results: SectionResult[] = [];
    const stage = isStage(page.stage) ? page.stage : undefined;
    const stageLabel = stage ? getStageLabel(stage) : '';
    if (matches(tokens, `${page.title} ${page.description} ${stageLabel}`)) {
      results.push({
        key: page.id,
        title: page.title,
        context: page.description,
        href: getHref(page.id),
        stage,
        isTitleMatch: matches(tokens, page.title),
      });
    }
    if (tokens.length) {
      for (const heading of page.headings) {
        const isDuplicate = results.some((result) => result.title === heading.text);
        if (!isDuplicate && matches(tokens, `${heading.text} ${page.title}`)) {
          results.push({
            key: `${page.id}#${heading.id}`,
            title: heading.text,
            context: page.title,
            href: getHref(page.id, heading.id),
            stage,
            isTitleMatch: matches(tokens, heading.text),
          });
        }
      }
    }
    if (tokens.length) {
      const components = chartExamples.find((example) => example.docId === page.id)?.components ?? [];
      results.push(...getPropResults(tokens, page, components, getHref));
    }
    return results;
  });
  // Stable sort keeps page order within each group.
  sections.sort((a, b) => Number(b.isTitleMatch) - Number(a.isTitleMatch));
  const shownSections = sections.slice(0, MAX_SECTIONS);

  const firstHref = shownSections[0]?.href ?? (cards[0] && getHref(cards[0].docId));
  const resultCount = shownSections.length + cards.length;

  return (
    <div className={styles.body}>
      <div className={styles.field}>
        <SearchField
          aria-label="Search docs"
          aria-describedby="docs-search-status"
          placeholder="Search charts, props, and guides"
          autoFocus
          value={query}
          onChange={setQuery}
          onSubmit={() => firstHref && onNavigate(firstHref)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            else event.continuePropagation();
          }}
          UNSAFE_className={styles.fieldInput}
        />
      </div>
      <div id="docs-search-status" role="status" className={styles.visuallyHidden}>
        {tokens.length ? `${resultCount} results` : ''}
      </div>
      <div className={styles.results}>
        {shownSections.length > 0 && (
          <nav aria-labelledby="docs-search-sections">
            <h3 id="docs-search-sections" className={styles.groupLabel}>
              {tokens.length ? 'Sections' : 'Pages'}
            </h3>
            <ul className={styles.sections}>
              {shownSections.map((section) => (
                <li key={section.key}>
                  <a
                    className={styles.section}
                    href={section.href}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(section.href);
                    }}
                  >
                    <span className={styles.sectionText}>
                      <span className={styles.sectionTitle}>{section.title}</span>
                      <span className={styles.sectionContext}>{section.context}</span>
                    </span>
                    {section.stage && <StageLabelBadge stage={section.stage} />}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {shownSections.length > 0 && cards.length > 0 && <Divider size="S" UNSAFE_className={styles.divider} />}
        {cards.length > 0 && (
          <nav aria-labelledby="docs-search-charts">
            <h3 id="docs-search-charts" className={styles.groupLabel}>
              Charts
            </h3>
            <div className={styles.cards}>
              {cards.map((example) => (
                <ExampleCard
                  key={example.docId}
                  example={example}
                  href={getHref(example.docId)}
                  stage={getPageStage(pages, example.docId)}
                  seen={seen}
                />
              ))}
            </div>
          </nav>
        )}
        {resultCount === 0 && <p className={styles.empty}>No results for “{query}”</p>}
      </div>
    </div>
  );
};

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

/**
 * Navbar search button that opens the chart search dialog; also opens with ⌘K / Ctrl+K.
 * @returns search trigger and dialog
 */
export const SearchDialog = () => {
  const { colorMode } = useColorMode();
  const history = useHistory();
  const [isOpen, setOpen] = useState(false);
  const shortcut = isMac() ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    history.push(href);
  };

  return (
    <Provider colorScheme={colorMode} router={{ navigate }} UNSAFE_className={styles.provider}>
      <div className={styles.triggerWrapper}>
        <ActionButton onPress={() => setOpen(true)} UNSAFE_className={styles.trigger}>
          <SearchIcon />
          <Text>Search</Text>
        </ActionButton>
        <Keyboard UNSAFE_className={styles.shortcut} aria-hidden>
          {shortcut}
        </Keyboard>
      </div>
      <DialogContainer onDismiss={() => setOpen(false)}>
        {isOpen && (
          <Dialog size="L" isDismissible UNSAFE_className={styles.dialog}>
            <Heading>Search</Heading>
            <Content>
              <SearchResults onNavigate={navigate} onClose={() => setOpen(false)} />
            </Content>
          </Dialog>
        )}
      </DialogContainer>
    </Provider>
  );
};
