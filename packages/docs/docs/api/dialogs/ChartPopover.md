The `ChartPopover` component defines the popover that will appear when the user selects a mark on the chart. `ChartPopover` must be used as a child of `Area`, `Bar`, `Line`, or `AxisAnnotation`. You should only have one popover defined per Chart visualization.

You can add interactive elements like buttons to the popover.

The `ChartPopover` uses the React Spectrum [Dialog](https://react-spectrum.adobe.com/react-spectrum/Dialog.html). Follow the React Spectrum [documentation](https://react-spectrum.adobe.com/react-spectrum/Dialog.html#content) to properly setup your dialog content.

```
<Chart data={data} >
    <Bar>
        <ChartPopover>
            {(datum, close) => (
                <Content>
                    <Text>Average: {datum.average}</Text>
                    <ActionButton onPress={close}>Close</ActionButton>
                </Content>
            )}
        </ChartPopover>
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
      <td>children*</td>
      <td>(datum: Datum, close: () => void) => ReactElement</td>
      <td>–</td>
      <td>Sets what is displayed by the popover. Supplies the datum for the value(s) that is currently selected and a close event handler. Function should return a ReactElement which will be the content of the popover.</td>
    </tr>
    <tr>
      <td>width</td>
      <td>number | 'auto'</td>
      <td>—</td>
      <td>Sets the width of the popover. `auto` will fit the contents plus any padding.</td>
    </tr>
    <tr>
      <td>minWidth</td>
      <td>number</td>
      <td>0</td>
      <td>Sets the minimum width of the popover in pixels.</td>
    </tr>
    <tr>
      <td>maxWidth</td>
      <td>number</td>
      <td>—</td>
      <td>Sets the maximum width of the popover in pixels.</td>
    </tr>
    <tr>
      <td>height</td>
      <td>number | 'auto'</td>
      <td>'auto'</td>
      <td>Sets the height of the popover. `auto` will fit the contents plus any padding.</td>
    </tr>
    <tr>
      <td>minHeight</td>
      <td>number</td>
      <td>—</td>
      <td>Sets the minimum height of the popover in pixels.</td>
    </tr>
    <tr>
      <td>maxHeight</td>
      <td>number</td>
      <td>—</td>
      <td>Sets the maximum height of the popover in pixels.</td>
    </tr>
    <tr>
      <td>containerPadding</td>
      <td>number</td>
      <td>12</td>
      <td>The placement padding that should be applied between the popover and its surrounding container.<br/>See <a href="https://react-spectrum.adobe.com/react-spectrum/DialogTrigger.html#container-padding">React Spectrum docs</a></td>
    </tr>
    <tr>
      <td>onOpenChange</td>
      <td>(isOpen: boolean) => void</td>
      <td>—</td>
      <td>Handler that is called when the popover's open state changes.</td>
    </tr>
  </tbody>
</table>
