/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement } from "react";

import useChartProps from '@hooks/useChartProps';
import { TrendlineAnnotation, Chart } from "@rsc";
import { StoryFn } from "@storybook/react";
import { bindWithProps } from '@test-utils';

export default {
    title: "RSC/TrendlineAnnotation",
    component: TrendlineAnnotation,
};

const TrendlineAnnotationStory: StoryFn<typeof TrendlineAnnotation> = (args): ReactElement => {
	// TODO: add data
    const chartProps = useChartProps({ data: [], width: 600 });

    // TODO: use TrendlineAnnotation correctly
    return (
        <Chart {...chartProps}>
            <TrendlineAnnotation {...args} />;
        </Chart>
    )

};

// TODO: add component props and additional stories here
const Basic = bindWithProps(TrendlineAnnotationStory);
Basic.args = {};


export { Basic };
