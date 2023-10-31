# React Spectrum Charts

<p align="center">
<a href="https://www.npmjs.com/package/@adobe/react-spectrum-charts" alt="Latest version">
    <img alt="npm" src="https://img.shields.io/npm/v/@adobe/react-spectrum-charts.svg?style=flat-square">
</a>
<a href="https://www.npmjs.com/package/@adobe/react-spectrum-charts" alt="Download count">
    <img alt="npm" src="https://img.shields.io/npm/dt/@adobe/react-spectrum-charts?style=flat-square">
</a>
<a href="https://github.com/adobe/react-spectrum-charts/graphs/contributors" alt="Contributors">
    <img src="https://img.shields.io/github/contributors/adobe/react-spectrum-charts" />
</a>
</p>

## Table of Contents

- [React Spectrum Charts](#react-spectrum-charts)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Key Features:](#key-features)
  - [Installation](#installation)
      - [npm](#npm)
      - [yarn](#yarn)
  - [Usage](#usage)
    - [Example](#example)
  - [Spectrum (Adobe Design System) Integration](#spectrum-adobe-design-system-integration)
  - [API](#api)
  - [Storybook](#storybook)
  - [Support](#support)
  - [Contributing](#contributing)
  - [License](#license)
    - [Apache License 2.0 Summary](#apache-license-20-summary)
  - [Roadmap](#roadmap)

## Overview

`react-spectrum-charts` is a declarative charting library for composing charts in React. It empowers you to effortlessly create visually stunning charts following the Adobe design system ([spectrum](https://spectrum.adobe.com)) with minimal code. Understanding of the grammar of graphics or lower-level libraries like D3 or Vega is not needed.

### Key Features:

-   **Responsive Charts:** `react-spectrum-charts` ensures that your charts adapt beautifully to different screen sizes and orientations, providing a seamless user experience on various devices.

-   **Interactive Charts:** Create engaging charts that respond to user interactions, such as hovering, clicking, and more. Enhance data exploration and understanding with interactive elements.

-   **Supported Chart Types:**

    -   **Area**
    -   **Bar**
    -   **Line**

-   **Supplemental Components:**

    -   **Annotation:** Add callouts to your charts.
    -   **Popover:** Add actions and additional content to selected data points.
    -   **Tooltip:** Add tooltip content to hovered points.
    -   **Trendline:** Add regressions or moving averages to your charts.

-   **Modular Components:**

    -   **Axis**
    -   **Legend**
    -   **Title**

-   **Simple and Intuitive API:** We've designed an API that's easy to understand and work with, allowing you to create beautiful charts quickly. No need to delve into the complexities of the grammar of graphics or wrestle with low-level libraries.

-   **Built on Vega:** `react-spectrum-charts` is built on top of Vega, a robust and versatile visualization grammar for expressive, concise, and interactive data visualizations. This foundation ensures both flexibility and performance.

`react-spectrum-charts` simplifies the charting process, making it accessible to a broader audience, including developers who may not have prior experience in data visualization. With just a few lines of code, you can create charts that meet the Adobe design system's standards, enriching your React applications with informative and visually appealing data representations.

## Installation

#### npm

```
npm install @adobe/react-spectrum-charts
```

#### yarn

```
yarn add @adobe/react-spectrum-charts
```

## Usage

The `react-spectrum-charts` is designed in a way that makes composing charts similar to composing any other app content in JSX.

Each chart is wrapped in the `<Prism/>` component. The child components and their props control the contents of the chart.

### Example

```
import React from 'react';
import {Axis, Bar, Legend, Prism} from '@adobe/react-spectrum-charts';

const MyChart: FC<MyChartProps> = (props) => {
    ...

    return (
        <Prism data={myChartData}>
            <Axis position="bottom" />
            <Axis position="left" />
            <Bar type="stacked" color="series" />
            <Legend />
        </Prism>
    )
}
```

## Spectrum (Adobe Design System) Integration

The Adobe design system has detailed guidelines for charting fundamentals, color selection for charts as well as design guidelines for the primary chart components.

`react-spectrum-charts` is the react implementation of these guidelines.

-   [Fundamentals](https://spectrum.adobe.com/page/data-visualization-fundamentals/)
-   [Color](https://spectrum.adobe.com/page/color-for-data-visualization/)
-   Components
    -   [Area](https://spectrum.adobe.com/page/area-chart/)
    -   [Bar](https://spectrum.adobe.com/page/bar-chart/)
    -   [Line](https://spectrum.adobe.com/page/line-chart/)

## API

[API Documentation](https://github.com/adobe/react-spectrum-charts/wiki)

## Storybook

This library has an extensive [Storybook](opensource.adobe.com/react-spectrum-charts/) with stories for every component as most props. You can use the controls tab in storybook to alter component props and see how that alters the chart real time.

It is also possible to view the source code for any story by selecting the "Docs" tab, scrolling to the desired story and then selecting "Show code". This is helpful for getting seeing the full API for any story in storybook.

The Storybook may contain components or props that are not released yet since it gets rebuilt with every push to main, not just with npm releases.

## Support

If you encounter any issues, have questions, or need assistance with **react-spectrum-charts**, there are several ways to get support:

1. **Documentation**: Check out the [official documentation](https://link-to-your-documentation) for in-depth guides, examples, and API references. Many common questions are answered here.

2. **GitHub Issues**: If you believe you've identified a bug or have a feature request or have general feedback, please review the list of [open issues](https://github.com/adobe/react-spectrum-charts/issues) to see if someone else has already submitted a similar issue that you can add to. If an issue doesn't exist, please submit a new issue using the correct template ([create a new issue](https://github.com/adobe/react-spectrum-charts/issues/new/choose)).

Please be respectful and considerate when seeking support. Provide as much context as possible when reporting issues, and follow any guidelines or templates specified in the GitHub issues section. Your feedback and contributions are highly valued.

## Contributing

[Contribution Guidelines](https://github.com/adobe/react-spectrum-charts/wiki)

## License

**react-spectrum-charts** is open-source software released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). You can find a copy of the license in the [LICENSE](LICENSE) file included with the project.

### Apache License 2.0 Summary

-   **Permissions**: You are granted broad permissions to use, modify, distribute, and sublicense the software. You can use it for commercial purposes.

-   **Conditions**: You must include the original copyright notice and disclaimers. You cannot use trademarks of the project without proper attribution.

-   **Limitations**: The license is not a warranty, and the software is provided "as is." The project's contributors are not liable for any damages.

-   **More Information**: For a full and detailed explanation of the Apache License 2.0, please refer to the [official license document](https://www.apache.org/licenses/LICENSE-2.0).

By using **react-spectrum-charts**, you agree to comply with the terms and conditions of the Apache License 2.0.

Please review the [LICENSE](LICENSE) file for the complete text of the license.

## Roadmap

The roadmap for this project is tracked in github projects. You must be a member of the Adboe org to see the roadmap.

[Roadmap](https://github.com/orgs/adobe/projects/46)
