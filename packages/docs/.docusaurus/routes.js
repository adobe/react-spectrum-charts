import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/react-spectrum-charts/docs/docs',
    component: ComponentCreator('/react-spectrum-charts/docs/docs', 'e91'),
    routes: [
      {
        path: '/react-spectrum-charts/docs/docs',
        component: ComponentCreator('/react-spectrum-charts/docs/docs', 'b2a'),
        routes: [
          {
            path: '/react-spectrum-charts/docs/docs',
            component: ComponentCreator('/react-spectrum-charts/docs/docs', 'a5f'),
            routes: [
              {
                path: '/react-spectrum-charts/docs/docs/api/analysis/MetricRange',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/analysis/MetricRange', '433'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/analysis/Trendline',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/analysis/Trendline', 'e46'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/Chart',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/Chart', 'ec3'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/components/Axis',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/components/Axis', '34e'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/components/Legend',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/components/Legend', '785'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/components/Title',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/components/Title', 'f18'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/interactivity/ChartPopover',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/interactivity/ChartPopover', 'ba7'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/interactivity/ChartTooltip',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/interactivity/ChartTooltip', 'f74'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/Area',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/Area', '1af'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/Bar',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/Bar', '5a0'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/BigNumber',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/BigNumber', '320'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/Donut',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/Donut', 'e55'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/Line',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/Line', '231'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/api/visualizations/Scatter',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/api/visualizations/Scatter', 'f4b'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/Developer-Docs',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/Developer-Docs', '2a2'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/guides/chart-basics',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/guides/chart-basics', 'e47'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/guides/troubleshooting',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/guides/troubleshooting', '472'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/installation',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/installation', 'c4e'),
                exact: true,
                sidebar: "sidebar"
              },
              {
                path: '/react-spectrum-charts/docs/docs/intro',
                component: ComponentCreator('/react-spectrum-charts/docs/docs/intro', 'fcd'),
                exact: true,
                sidebar: "sidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/react-spectrum-charts/docs/',
    component: ComponentCreator('/react-spectrum-charts/docs/', 'd95'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
