# Annotation

\*\*`Annotation` only supports `Bar` components at this time.

The `Annotation` component is used to display a text annotation. The annotation will display at the top of the bar for each data point in `data`.

<img width="724" alt="Screen Shot 2023-03-29 at 9 02 46 AM" src="https://github.com/adobe/react-spectrum-charts/assets/29240999/989e7e74-fa52-4193-910e-39d3d80876e1" />

```jsx
<Chart data=\{data}>
    <Bar \{...props}>
        <Annotation textKey="textKey" style=\{\{width: 48}} />
    </Bar>
</Chart>
```

### Props

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
            <td>textKey</td>
            <td>string</td>
            <td>–</td>
            <td>The key on each value in the data passed to the chart that contains the text to display in the annotation.</td>
        </tr>
        <tr>
            <td>style</td>
            <td>\{width: number}</td>
            <td>-</td>
            <td>Style overrides. Width is used in place of dynamically calculated width.</td>
        </tr>
    </tbody>
</table>
