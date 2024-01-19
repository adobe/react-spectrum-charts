/*
 * Copyright 2023 Adobe. All rights reserved.
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
import { Scatter, Chart } from "@rsc";
import { ComponentStory } from "@storybook/react";
import { bindWithProps } from '@test-utils';

export default {
    title: "RSC/Scatter",
    component: Scatter,
};

const ScatterStory: ComponentStory<typeof Scatter> = (args): ReactElement => {
	// TODO: add data
    const chartProps = useChartProps({ data: [], width: 600 });

    // TODO: use Scatter correctly
    return (
        <Chart {...chartProps}>
            <Scatter {...args} />;
        </Chart>
    )

};

// TODO: add component props and additional stories here
const Basic = bindWithProps(ScatterStory);
Basic.args = {};


export { Basic };
