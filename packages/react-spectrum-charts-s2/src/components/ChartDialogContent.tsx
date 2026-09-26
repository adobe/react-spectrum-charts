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
import { FC, ReactNode } from 'react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

interface DonutDialogContentOptions {
  colorKey: string;
  metricKey: string;
}

interface DonutDialogContentProps extends DonutDialogContentOptions {
  children?: ReactNode;
  datum: Datum;
  getColor: (value: unknown) => string | undefined;
}

const DonutDialogContent: FC<DonutDialogContentProps> = ({ children, colorKey, datum, getColor, metricKey }) => {
  const series = datum[colorKey];
  return (
    <div className="rsc-donut-dialog-content">
      <span
        aria-hidden="true"
        className="rsc-donut-dialog-swatch"
        data-testid="donut-dialog-swatch"
        style={{ backgroundColor: getColor(series) }}
      />
      <span className="rsc-donut-dialog-series">{String(series ?? '')}</span>
      <span className="rsc-donut-dialog-value">{String(datum[metricKey] ?? '')}</span>
      {children != null && <div className="rsc-donut-dialog-custom">{children}</div>}
    </div>
  );
};

export { DonutDialogContent };
export type { DonutDialogContentOptions, DonutDialogContentProps };
