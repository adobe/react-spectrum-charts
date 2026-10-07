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
import { Axis } from '../../../../components';
import { bindWithProps } from '../../../../test-utils';
import { CampaignBarStory, controls } from '../axisStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Tooltips',
  component: Axis,
};

// Hover a truncated campaign name to see its full text.
const HasTooltip = bindWithProps(CampaignBarStory);
HasTooltip.args = { position: 'bottom', baseline: true, title: 'Campaign', truncateLabels: true, hasTooltip: true };
Object.assign(HasTooltip, controls('hasTooltip'));

// Hover campaign names: one shows custom text, one has its tooltip suppressed, the rest show the full name.
const TooltipText = bindWithProps(CampaignBarStory);
TooltipText.args = {
  position: 'bottom',
  baseline: true,
  title: 'Campaign',
  truncateLabels: true,
  hasTooltip: true,
  tooltipText: [
    { value: 'Holiday gift guide search ads', text: 'Holiday gift guide search ads — Nov 15 to Dec 24' },
    { value: 'Loyalty program launch', text: null },
  ],
};
Object.assign(TooltipText, controls('tooltipText'));

export { HasTooltip, TooltipText };
