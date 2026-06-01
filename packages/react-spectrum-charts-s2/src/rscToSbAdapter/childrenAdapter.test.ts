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
import { createElement } from 'react';

import { LinePointAnnotation } from '../components/LinePointAnnotation';

// sanitizeChildren pre-filters children based on a validDisplayNames allowlist, so the
// "no displayName" and "unknown displayName" branches inside childrenToOptions are only
// reachable by controlling what sanitizeChildren returns. We mock the utils module here
// to exercise those defensive branches directly.
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  sanitizeChildren: jest.fn(),
}));

// Import after the mock is declared so childrenAdapter picks up the mocked sanitizeChildren.
import { sanitizeChildren } from '../utils';
import { childrenToOptions } from './childrenAdapter';

const mockSanitizeChildren = sanitizeChildren as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('childrenToOptions — LinePointAnnotation case', () => {
  test('pushes props into linePointAnnotations when LinePointAnnotation is a child', () => {
    mockSanitizeChildren.mockReturnValue([
      createElement(LinePointAnnotation, { textKey: 'label', anchor: 'left' }),
    ]);

    const result = childrenToOptions(null);
    expect(result.linePointAnnotations).toHaveLength(1);
    expect(result.linePointAnnotations[0]).toEqual({ textKey: 'label', anchor: 'left' });
  });

  test('returns empty linePointAnnotations when no LinePointAnnotation children', () => {
    mockSanitizeChildren.mockReturnValue([]);

    const result = childrenToOptions(null);
    expect(result.linePointAnnotations).toHaveLength(0);
  });

  test('collects multiple LinePointAnnotation children', () => {
    mockSanitizeChildren.mockReturnValue([
      createElement(LinePointAnnotation, { textKey: 'label', key: 'a' }),
      createElement(LinePointAnnotation, { textKey: 'value', key: 'b' }),
    ]);

    const result = childrenToOptions(null);
    expect(result.linePointAnnotations).toHaveLength(2);
  });
});

describe('childrenToOptions — error cases', () => {
  test('logs an error and skips a child with no displayName', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // A plain function has no displayName property on its type.
    const NoDisplayName = () => null;
    delete (NoDisplayName as unknown as Record<string, unknown>).displayName;
    mockSanitizeChildren.mockReturnValue([createElement(NoDisplayName)]);

    const result = childrenToOptions(null);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid component type. Component is missing display name.'
    );
    // The child is skipped — no side effects on any collection.
    expect(result.linePointAnnotations).toHaveLength(0);
    expect(result.lines).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  test('logs an error for a child whose displayName is not handled by the switch', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const UnknownComponent = () => null;
    (UnknownComponent as unknown as Record<string, unknown>).displayName = 'UnknownComponent';
    mockSanitizeChildren.mockReturnValue([createElement(UnknownComponent)]);

    const result = childrenToOptions(null);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid component type: ',
      'UnknownComponent'
    );
    // The child is skipped — no side effects on any collection.
    expect(result.linePointAnnotations).toHaveLength(0);
    expect(result.lines).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});
