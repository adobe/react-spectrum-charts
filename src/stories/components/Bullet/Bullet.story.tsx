import { ReactElement } from 'react';
import { StoryFn } from '@storybook/react';
import { Bullet } from '@rsc/alpha'; // Assuming Bullet chart is a component in the @rsc/rc library
import { Chart, BulletProps } from '@rsc';
import useChartProps from '@hooks/useChartProps';
import { bindWithProps } from '@test-utils';
import { basicBulletData } from './data';

export default {
    title: 'RSC/Bullet',
    component: Bullet,
};

// Default chart properties
const defaultChartProps = {
    data: basicBulletData,
    width: 600,
    height: 400,
};

// Basic Bullet chart story
const BulletStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
    const { width, height, ...bulletProps } = args;
    const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
    return (
        <Chart {...chartProps} debug>
            <Bullet {...bulletProps} />
        </Chart>
    );
};

const Basic = bindWithProps(BulletStory);
Basic.args = {
	chartLabel: 'label',
};

export { Basic };