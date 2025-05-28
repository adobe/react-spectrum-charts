<!-- Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

# Customization

Learn how to customize your charts with React Spectrum Charts.

## Theming

React Spectrum Charts follows Adobe's Spectrum design system, but allows for customization:

```jsx
import { Chart, BarChart } from '@adobe/react-spectrum-charts';
import { Theme } from '@spectrum-charts/themes';

function ThemedChart() {
  return (
    <Chart data={data} theme={Theme.Light}>
      <BarChart
        x={d => d.category}
        y={d => d.value}
      />
    </Chart>
  );
}
```

## Colors

You can customize colors for individual elements:

```jsx
import { Chart, BarChart } from '@adobe/react-spectrum-charts';

function CustomColorChart() {
  return (
    <Chart data={data}>
      <BarChart
        x={d => d.category}
        y={d => d.value}
        fill="#1473E6"  // Spectrum Blue
      />
    </Chart>
  );
}
```

## Axes and Labels

Customize axes and labels to match your needs:

```jsx
import { Chart, BarChart, XAxis, YAxis } from '@adobe/react-spectrum-charts';

function CustomAxesChart() {
  return (
    <Chart data={data}>
      <BarChart
        x={d => d.category}
        y={d => d.value}
      />
      <XAxis label="Categories" />
      <YAxis label="Values" />
    </Chart>
  );
}
```

## Animations

Add animations to your charts:

```jsx
import { Chart, BarChart } from '@adobe/react-spectrum-charts';

function AnimatedChart() {
  return (
    <Chart data={data}>
      <BarChart
        x={d => d.category}
        y={d => d.value}
        animate={true}
        animationDuration={500}
      />
    </Chart>
  );
}
``` 