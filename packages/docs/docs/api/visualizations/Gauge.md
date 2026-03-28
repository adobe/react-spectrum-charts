## ALPHA RELEASE 

Gauge is currently in alpha. This means that the component, behavior and API are all subject to change. 

```
import { Chart, ChartProps } from '@adobe/react-spectrum-charts';
import { Gauge, GaugeSummary, SegmentLabel } from '@adobe/react-spectrum-charts/rc';
```

# Gauge

The `Gauge` component is used to display data in a dashboard gauge style. 

## Data visualization 

Unlike many other chart types, `Gauge` draws two marks (arcs) for a given series, and a mark needle for progression measurement and data tracking. The two arcs shown are the backgrounds arc and the filling color arc, showing the progress based on the current value.


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
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>Key in the data that is used as the color to current value.</td>
        </tr>
        <tr>
            <td>currVal</td>
            <td>number</td>
            <td>75</td>
            <td>The current value tracked and its progress in the gauge. Set to 75 out of 100 by default.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>number</td>
            <td>'value'</td>
            <td>The key in the data that is used for the current value.</td>
        </tr>
        <tr>
            <td>maxArcValue</td>
            <td>number</td>
            <td>100</td>
            <td>The maximum value of the arc in the gauge. Set to 100 by default.</td>
        </tr>
                <tr>
            <td>minArcValue</td>
            <td>number</td>
            <td>0</td>
            <td>The minimum value of the arc in the gauge. Set to 0 by default.</td>
        </tr>
   </tbody>
</table>
