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
import { JSXElementConstructor, ReactElement } from 'react';

import { GaugeOptions } from '@spectrum-charts/vega-spec-builder-s2';

// arcSize/holeRatio are chart-author-only geometry knobs (design-system-owned), not exposed
// to end consumers of <Gauge> - set them via the vega-spec-builder-s2 GaugeOptions directly
// if a design-system-internal override is ever needed.
export type GaugeProps = Omit<GaugeOptions, 'markType' | 'arcSize' | 'holeRatio'>;

export type GaugeElement = ReactElement<GaugeProps, JSXElementConstructor<GaugeProps>>;
