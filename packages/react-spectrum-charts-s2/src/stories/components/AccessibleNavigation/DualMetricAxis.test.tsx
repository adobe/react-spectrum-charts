import { fireEvent } from '@testing-library/react';

import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { DualMetricAxisBarNavigation } from './DualMetricAxis.story';

test('Dual-metric-axis navigation focuses a bar', async () => {
  render(<DualMetricAxisBarNavigation {...DualMetricAxisBarNavigation.args} />);
  const chart = await findChart();
  const container = chart.closest('.rsc-container') as HTMLElement;
  (container.querySelector('button') as HTMLButtonElement).click();
  const node = container.querySelector('.dn-node') as HTMLElement;
  fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
  fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
  const rings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
  expect(rings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);
});
