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
import { DocEntry, errorToString, getDocById } from './utils';

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
