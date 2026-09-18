import { fireEvent } from '@testing-library/react';

import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { ReferenceLineBarNavigation } from './ReferenceLineBar.story';

test('Reference-line bar navigation focuses a bar', async () => {
  render(<ReferenceLineBarNavigation {...ReferenceLineBarNavigation.args} />);
  const chart = await findChart();
  const container = chart.closest('.rsc-container') as HTMLElement;
  (container.querySelector('button') as HTMLButtonElement).click();
  const node = container.querySelector('.dn-node') as HTMLElement;
  fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
  const rings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
  expect(rings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);
});
