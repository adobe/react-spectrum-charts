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
import { ReactElement } from 'react';

import { BarDecorationInput, BarInput } from '@spectrum-charts/schemas';

import { Bar, BarDirectLabel, ChartInspect } from '../../../../components';

function renderBarDecoration(
  decoration: BarDecorationInput,
  key: number,
  dimension?: string,
  metric?: string
): ReactElement {
  switch (decoration.component) {
    case 'BarDirectLabel': {
      const { component: _component, ...props } = decoration;
      return <BarDirectLabel key={key} {...props} />;
    }
    case 'ChartInspect': {
      const { component: _component, ...props } = decoration;
      // ChartInspectProps.children is a (datum) => ReactNode render prop, which isn't representable
      // in the JSON request — default to a plain "dimension: metric" tooltip body.
      return (
        <ChartInspect key={key} {...props}>
          {(datum) => (
            <>
              {dimension ? String(datum[dimension]) : ''}: {metric ? String(datum[metric]) : ''}
            </>
          )}
        </ChartInspect>
      );
    }
  }
}

// A plain function, not a JSX-invoked component: childrenAdapter.ts identifies marks by
// child.type.displayName on Chart's *direct* children, so the returned element's type must be
// Bar itself. Wrapping this in a component rendered via `<CatalogBar />` would make the direct
// child's type CatalogBar instead, which childrenAdapter doesn't recognize — it gets silently
// dropped (logged as "Invalid component type") rather than rendered.
export function renderCatalogBar(mark: BarInput, key: number): ReactElement {
  const { component: _component, decorations, ...barProps } = mark;
  return (
    <Bar key={key} {...barProps}>
      {decorations?.map((decoration, i) =>
        renderBarDecoration(decoration, i, barProps.dimension, barProps.metric)
      )}
    </Bar>
  );
}
