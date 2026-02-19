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
import { TextMark } from 'vega';

import { ScatterAnnotationOptions, ScatterAnnotationSpecOptions, ScatterSpecOptions } from '../../types';

export const getScatterAnnotationSpecOptions = (
  { anchor = ['right', 'top', 'bottom', 'left'], textKey }: ScatterAnnotationOptions,
  index: number,
  scatterOptions: ScatterSpecOptions
): ScatterAnnotationSpecOptions => {
  return {
    anchor,
    textKey: textKey ?? scatterOptions.metric,
    index,
    name: `${scatterOptions.name}Annotation${index}`,
    scatterOptions,
  };
};

export const getScatterAnnotations = (scatterOptions: ScatterSpecOptions): ScatterAnnotationSpecOptions[] => {
  return scatterOptions.scatterAnnotations.map((path, index) =>
    getScatterAnnotationSpecOptions(path, index, scatterOptions)
  );
};

export const getScatterAnnotationMarks = (scatterOptions: ScatterSpecOptions): TextMark[] => {
  const annotations = getScatterAnnotations(scatterOptions);
  const marks: TextMark[] = [];

  for (const annotation of annotations) {
    const { anchor, name: scatterAnnotationName, textKey } = annotation;
    marks.push({
      name: scatterAnnotationName,
      type: 'text',
      from: {
        data: annotation.scatterOptions.name,
      },
      encode: {
        enter: {
          text: { signal: `datum.datum.${textKey}` },
        },
        update: {
          // use the same opacity as the scatter mark
          // have to use fillOpacity instead of opacity because there is a bug in Vega where using opacity will cause the marks to be redrawn when also using a label transform.
          fillOpacity: { signal: 'datum.opacity' },
        },
      },
      transform: [
        {
          type: 'label',
          size: { signal: '[width, height]' },
          anchor: Array.isArray(anchor) ? anchor : [anchor],
        },
      ],
    });
  }

  return marks;
};
