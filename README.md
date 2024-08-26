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

![Scatter plot of penguin bill dimensions by species and body mass](https://github.com/adobe/react-spectrum-charts/wiki/images/penguins.png)

## Table of Contents

-   [React Spectrum Charts](#react-spectrum-charts)
    -   [Table of Contents](#table-of-contents)
    -   [Overview](#overview)
        -   [Key Features:](#key-features)
    -   [Installation](#installation)
        -   [npm](#npm)
        -   [yarn](#yarn)
    -   [Usage](#usage)
        -   [Example](#example)
    -   [Spectrum (Adobe Design System) Integration](#spectrum-adobe-design-system-integration)
    -   [API](#api)
    -   [Storybook](#storybook)
    -   [Support](#support)
    -   [Contributing](#contributing)
    -   [License](#license)
        -   [Apache License 2.0 Summary](#apache-license-20-summary)
    -   [Roadmap](#roadmap)

## Overview

`react-spectrum-charts` is a declarative charting library for composing charts in React. It empowers you to effortlessly create visually stunning charts following Adobe's design system ([Spectrum](https://spectrum.adobe.com)) with minimal code. Understanding of the grammar of graphics or lower-level libraries like D3 or Vega is not needed.

### Key Features:

-   **Intuitive**: Developer experience comes first in the API design. The declarative API removes the need to understand advanced data visualization concepts. The code reads just like you would explain the chart to someone else.

-   **Configurable**: The component-based building blocks enable you to build the chart that solves your use case. The modular design makes it easy to compose complex visualizations with simple, easy to understand code.

-   **Proven**: By leveraging Spectrum ([Adobe's Spectrum design system](https://spectrum.adobe.com/)) you get beautiful charts backed by research, user testing, and industry best practices.

-   **International**: Support for 30+ date/number locales so that your users can view their data in the format that they would expect.

## Installation

#### npm

```bash
npm install @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite
```

#### yarn

```bash
yarn add @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite
```

## Usage

`react-spectrum-charts` is designed in a way that makes composing charts similar to composing any other app content in JSX.

Each chart is wrapped in the `<Chart/>` component. The child components and their props control the contents of the chart.

### Example

```ts
import React from 'react';
import {Axis, Bar, Legend, Chart} from '@adobe/react-spectrum-charts';

const MyChart: FC<MyChartProps> = (props) => {
    ...

    return (
        <Chart data={myChartData}>
            <Axis position="bottom" />
            <Axis position="left" />
            <Bar type="stacked" color="series" />
            <Legend />
        </Chart>
    )
}
```

## Spectrum (Adobe Design System) Integration

Adobe's design system has detailed guidelines for charting fundamentals, color selection for charts as well as design guidelines for the primary chart components.

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

This library has an extensive [Storybook](http://opensource.adobe.com/react-spectrum-charts/) with stories for every component and most props. You can use the controls tab in storybook to alter component props and see how that alters the chart in real time.

It is also possible to view the source code for any story by selecting the "Docs" tab, scrolling to the desired story and then selecting "Show code". This is helpful for seeing the full API for any story in storybook.

The Storybook may contain components or props that are not released yet since it gets rebuilt with every push to main, not just with npm releases.

## Support

If you encounter any issues, have questions, or need assistance with **react-spectrum-charts**, there are several ways to get support:

1. **Documentation**: Check out the [official documentation](https://github.com/adobe/react-spectrum-charts/wiki) for examples, API documentation and developer docs.

2. **GitHub Issues**: If you believe you've identified a bug or have a feature request or have general feedback, please review the list of [open issues](https://github.com/adobe/react-spectrum-charts/issues) to see if someone else has already submitted a similar issue that you can add to. If an issue doesn't exist, please submit a new issue using the correct template ([create a new issue](https://github.com/adobe/react-spectrum-charts/issues/new/choose)).

Please be respectful and considerate when seeking support. Provide as much context as possible when reporting issues, and follow any guidelines or templates specified in the GitHub issues section. Your feedback and contributions are highly valued.

## Contributing

[Contribution Guidelines](./CONTRIBUTING.md)

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

The roadmap for this project is tracked in github projects. You must be a member of the Adobe org to see the roadmap.

[Roadmap](https://github.com/orgs/adobe/projects/46)
