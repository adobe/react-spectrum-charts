## ALPHA RELEASE 

Gauge is currently in alpha. This means that the component, behavior and API are all subject to change. 

```
import { Chart, ChartProps } from '@adobe/react-spectrum-charts';
import { Gauge, GaugeSummary, SegmentLabel } from '@adobe/react-spectrum-charts/rc';
```

# Gauge
The `Gauge` component is used to display data in a dashboard gauge style. 

## Needle 
The gauge can draw a mark needle for progression measurement and data tracking. Disabled by default.

## Target Line
The target line shows a line representing a goal value for the metric. Disabled by default.

## Performance Ranges
The gauge can draw `performance ranges` marks for a given series of target ranges, defining color for detailed data tracking. Disabled by default.

## Dynamic Labeling with unit options
The guage label can be represented as a percentage or numeric value and resizes in relation to the needle being present. 

## Props

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>metric</td>
            <td>number</td>
            <td>'value'</td>
            <td>The data that is used for the current value.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The data that is used as the color to current value.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>'gauge0'</td>
            <td>Sets the name of the component.</td>
        </tr>
        <tr>
            <td>graphLabel</td>
            <td>string</td>
            <td>'graphLabel'</td>
            <td>The data that is used as the graph label.</td>
        </tr>
        <tr>
            <td>showLabel</td>
            <td>boolean</td>
            <td>false</td>
            <td>Sets to show the label or not.</td>
        </tr>
        <tr>
            <td>showsAsPercent</td>
            <td>boolean</td>
            <td>false</td>
            <td>Sets to show the current value as a percentage or not.</td>
        </tr>
        <tr>
            <td>minArcValue</td>
            <td>number</td>
            <td>0</td>
            <td>Minimum value for the scale. This value must be greater than zero, and less than maxArcValue.</td>
        </tr>
        <tr>
            <td>maxArcValue</td>
            <td>number</td>
            <td>100</td>
            <td>Maximum value for the scale. This value must be greater than zero, and greater than minArcValue.</td>
        </tr>
        <tr>
            <td>currVal</td>
            <td>number</td>
            <td>75</td>
            <td>The current value tracked and its progress in the gauge. Set to 75 out of 100 by default.</td>
        </tr>
        <tr>
            <td>backgroundFill</td>
            <td>string</td>
            <td>-</td>
            <td>The color of the background arc.</td>
        </tr>
        <tr>
            <td>backgroundStroke</td>
            <td>string</td>
            <td>-</td>
            <td>The color of the background stroke.</td>
        </tr>
        <tr>
            <td>fillerColorSignal</td>
            <td>string</td>
            <td>-</td>
            <td>The color of the filler color arc.</td>
        </tr>
        <tr>
            <td>needle</td>
            <td>boolean</td>
            <td>false</td>
            <td>The needle mark for tracking progress towards a goal.</td>
        </tr>
        <tr>
            <td>target</td>
            <td>string</td>
            <td>'target'</td>
            <td>The data that is used as the target.</td>
        </tr>
        <tr>
            <td>targetLine</td> 
            <td>boolean</td>
            <td>false</td>
            <td>Shows a line for target tracking.</td>
        </tr>
        <tr>
            <td>performanceRanges</td>
            <td>-</td>
            <td>false</td>
            <td>Array of performance ranges to be rendered as filled bands on the gauge.</td>
        </tr>
        <tr>
            <td>showPerformanceRanges</td>
            <td>number</td>
            <td>0</td>
            <td>If true, show banded performance ranges instead of a colored filler arc.</td>
        </tr>
   </tbody>
</table>
