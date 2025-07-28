# React Spectrum Charts Documentation

This package contains the documentation website for React Spectrum Charts, built with [Docusaurus](https://docusaurus.io/).

## Development

To start the development server:

```bash
# From the root of the monorepo
yarn workspace @spectrum-charts/docs start
```

This will start a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

## Build

To build the documentation:

```bash
# From the root of the monorepo
yarn workspace @spectrum-charts/docs build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Writing Documentation

The documentation is written in Markdown and is located in the `docs` directory. The sidebar structure is defined in `sidebars.ts`.

### Directory Structure

```
docs/
├── docs/
│   ├── intro.md
│   ├── installation.md
│   ├── guides/
│   │   ├── chart-basics.md
│   │   └── troubleshooting.md
│   ├── api/
│   │   ├── Chart.md
│   │   ├── analysis/
│   │   ├── components/
│   │   ├── interactivity/
│   │   └── visualizations/
│   └── developers/
│       └── Developer-Docs.md
├── src/
│   ├── components/
│   ├── css/
│   └── pages/
└── static/
    └── img/
```

## Contributing

Please see the main repository's CONTRIBUTING.md file for guidelines on how to contribute to the documentation.
