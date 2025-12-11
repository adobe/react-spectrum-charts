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

export type Section = {
  title: string;
  level: number;
  content: string;
};

export type DocEntry = {
  id: string;
  relPath: string;
  title: string;
  description: string;
  sections: Section[];
  content: string;
};

export function errorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export function getDocById(docs: DocEntry[], id: string): DocEntry {
  const doc = docs.find((d) => d.id === id);
  if (!doc) {
    throw new Error(`Doc not found for id=${id}`);
  }
  return doc;
}

export function extractDescription(content: string): string {
  const body = content.replace(/^#\s+.+\n*/, '');
  const match = body.match(/^([^\n#].+?)(?:\n\n|\n#|$)/s);
  if (match) {
    return match[1].replace(/\s+/g, ' ').trim();
  }
  return '';
}

export function extractSections(content: string): Section[] {
  const sections: Section[] = [];
  const headingRegex = /^(#{2,6})\s+(.+)$/gm;
  let match;

  const headings: { level: number; title: string; start: number }[] = [];
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      start: match.index,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextStart = headings[i + 1]?.start ?? content.length;
    const sectionContent = content.slice(heading.start, nextStart).trim();

    sections.push({
      title: heading.title,
      level: heading.level,
      content: sectionContent,
    });
  }

  return sections;
}

