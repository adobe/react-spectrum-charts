import { ReactElement } from 'react';
import { StoryFn } from '@storybook/react';
import { Bullet } from '@rsc/alpha'; // Assuming Bullet chart is a component in the @rsc/rc library
import { Chart } from '@rsc';

// Sample data for the Bullet chart
const bulletChartData = [
    { category: 'New Customer Count', amount: 180, myvalue: '20', tickposition: 150 },
    { category: 'Downloads of Adobe Acrobat', amount: 180, myvalue: '1.42 M', tickposition: 170 },
    { category: 'Third Customer', amount: 140, myvalue: '15', tickposition: 50 },
    { category: 'Fourth Customer', amount: 90, myvalue: '15', tickposition: 100 }
];

// Default chart properties
const defaultChartProps = {
    data: bulletChartData,
    width: 600,
    height: 400,
};

// Basic Bullet chart story
const BulletChart: StoryFn = (): ReactElement => {
    return (
        <Chart {...defaultChartProps} debug>
            <Bullet name="bulletChart" markType="bullet" />
        </Chart>
    );
};

// Exporting the story
export default {
    title: 'RSC/Bullet',
    component: BulletChart,
};

export { BulletChart };