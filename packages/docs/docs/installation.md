# Installation

This guide will help you get started with React Spectrum Charts in your project.

## Prerequisites

React Spectrum Charts requires:

- React 18 or later
- Node.js 18 or later
- npm 7+ or yarn 1.22+

## Installation Steps

1. First, install the package using your preferred package manager:

```bash
# Using npm
npm install @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite

# Using yarn
yarn add @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite

# Using pnpm
pnpm add @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite
```

2. Import and use the components in your React application:

```jsx
import { Chart } from '@adobe/react-spectrum-charts';
```

## Usage with TypeScript

React Spectrum Charts includes TypeScript definitions out of the box. No additional setup is required.

## Configuration

React Spectrum Charts works with most build tools including:

- Create React App
- Next.js
- Vite
- Webpack
- Rollup
- Parcel.js

No additional configuration is typically needed for these build systems.

## Troubleshooting

If you encounter any issues during installation:

1. Make sure all peer dependencies are installed correctly
2. Verify you're using compatible versions of React and Node.js
3. Clear your package manager's cache and node_modules
4. Try a fresh install

If problems persist, there may be a solution in our [troubleshooting guide](guides/troubleshooting). If not, please check our [GitHub issues](https://github.com/adobe/react-spectrum-charts/issues) or create a new one.
