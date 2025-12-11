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

import { errorToString, getDocById, extractDescription, extractSections, DocEntry } from './utils';

describe('errorToString', () => {
  it('returns message from Error instances', () => {
    const err = new Error('test error');
    expect(errorToString(err)).toBe('test error');
  });

  it('converts non-Error values to string', () => {
    expect(errorToString('string error')).toBe('string error');
    expect(errorToString(123)).toBe('123');
    expect(errorToString(null)).toBe('null');
    expect(errorToString(undefined)).toBe('undefined');
  });
});

describe('getDocById', () => {
  const mockDocs: DocEntry[] = [
    { id: 'intro', relPath: 'intro.md', title: 'Introduction', description: 'Intro desc', sections: [], content: '' },
    { id: 'api/Chart', relPath: 'api/Chart.md', title: 'Chart', description: 'Chart desc', sections: [], content: '' },
  ];

  it('finds doc by id', () => {
    const doc = getDocById(mockDocs, 'intro');
    expect(doc.title).toBe('Introduction');
  });

  it('finds nested doc by id', () => {
    const doc = getDocById(mockDocs, 'api/Chart');
    expect(doc.title).toBe('Chart');
  });

  it('throws when doc not found', () => {
    expect(() => getDocById(mockDocs, 'nonexistent')).toThrow('Doc not found for id=nonexistent');
  });
});

describe('extractDescription', () => {
  it('extracts first paragraph after title', () => {
    const content = `# Title

This is the first paragraph.

## Section`;
    expect(extractDescription(content)).toBe('This is the first paragraph.');
  });

  it('handles multi-line paragraphs', () => {
    const content = `# Title

This is a paragraph
that spans multiple lines.

## Section`;
    expect(extractDescription(content)).toBe('This is a paragraph that spans multiple lines.');
  });

  it('stops at heading', () => {
    const content = `# Title

Description here.
## Next Section`;
    expect(extractDescription(content)).toBe('Description here.');
  });

  it('returns empty string when no content', () => {
    const content = `# Title Only`;
    expect(extractDescription(content)).toBe('');
  });
});

describe('extractSections', () => {
  it('extracts h2-h6 headings', () => {
    const content = `# Title

Intro

## Section One

Content one

### Subsection

Sub content

## Section Two

Content two`;

    const sections = extractSections(content);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe('Section One');
    expect(sections[0].level).toBe(2);
    expect(sections[1].title).toBe('Subsection');
    expect(sections[1].level).toBe(3);
    expect(sections[2].title).toBe('Section Two');
    expect(sections[2].level).toBe(2);
  });

  it('includes content in sections', () => {
    const content = `## Section

Some content here`;

    const sections = extractSections(content);
    expect(sections[0].content).toContain('Some content here');
  });

  it('returns empty array for no headings', () => {
    const content = `Just some text without headings`;
    expect(extractSections(content)).toHaveLength(0);
  });

  it('ignores h1 headings', () => {
    const content = `# Title

## Real Section`;

    const sections = extractSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Real Section');
  });
});

