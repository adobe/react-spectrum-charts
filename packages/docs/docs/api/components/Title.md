The `Title` component is used to add a title to a chart. Only a single title is supported. In cases where multiple `Title`s are provided, only the last `Title` will be used.

### Example

```jsx
<Chart data={data}>
    <Title text="Chart Title" position="middle" fontWeight="bolder" />
</Chart>
```

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
            <td>fontWeight</td>
            <td>'normal' | 'bold' | 'lighter' | 'bolder' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900</td>
            <td>'bold'</td>
            <td>The font weight of the title text.</td>
        </tr>
        <tr>
            <td>orient</td>
            <td>'top' | 'bottom' | 'left' | 'right'</td>
            <td>'top'</td>
            <td>The position of the title relative to the chart.</td>
        </tr>
        <tr>
            <td>position</td>
            <td>'start' | 'middle' | 'end'</td>
            <td>'middle'</td>
            <td>The horizontal position of the title.</td>
        </tr>
        <tr>
            <td>text</td>
            <td>string</td>
            <td>''</td>
            <td>The text to display in the title.</td>
        </tr>
    </tbody>
</table>