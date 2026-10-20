# Exporting

Pass a `ref` to `Chart` to get a `ChartHandle`, which exports the chart as an image. See [Exporting images](/react-spectrum-charts/s2/docs/docs/chart#exporting-images) on the Chart page for a live example.

```tsx
import { useRef } from 'react';
import { ActionButton } from '@react-spectrum/s2';
import { Axis, Chart, ChartHandle, Line } from '@spectrum-charts/react-spectrum-charts-s2';

function VisitsChart({ data }) {
  const chartRef = useRef<ChartHandle>(null);

  return (
    <>
      <Chart ref={chartRef} data={data} title="Visits by device">
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Line dimension="datetime" metric="visits" color="device" />
      </Chart>
      <ActionButton onPress={() => chartRef.current?.download()}>Download</ActionButton>
    </>
  );
}
```

## Methods

Every method returns a promise.

| Method | Resolves to |
| --- | --- |
| `download(customFileName?)` | A status message, after starting a PNG download. |
| `copy()` | A status message, after writing a PNG to the clipboard. |
| `getBase64Png()` | The PNG as a data URL (`data:image/png;base64,…`). |
| `getSvg()` | The chart as an SVG string. |

The image is the chart at its rendered size, including axes, legend, and title.

### File name

`download()` names the file after the `title` prop on `Chart`, or `chart_export` if there's no `title`, and adds `.png`. A [`Title`](/react-spectrum-charts/s2/docs/docs/title) child doesn't set the file name. Pass a name to override it, without the extension:

```tsx
chartRef.current?.download('visits-march-2026'); // visits-march-2026.png
```

## When exports fail

The promise rejects with an `Error` when there's nothing to export:

-   The chart hasn't finished rendering yet. Wait for [`onVegaViewReady`](/react-spectrum-charts/s2/docs/docs/chart#advanced) before exporting programmatically.
-   `loading` is `true`, or `data` is empty, so the chart shows a placeholder.
-   The chart has no size, for example because its container is 0px wide.

`copy()` also rejects if the browser refuses the clipboard write. The Clipboard API with images needs a secure context (HTTPS or `localhost`), and browsers usually only allow it in response to a user action, like a button press. Handle the rejection and tell the user:

```tsx
const handleCopy = async () => {
  try {
    await chartRef.current?.copy();
    showToast('Chart copied');
  } catch {
    showToast("Couldn't copy the chart");
  }
};
```

`copy()` and `getBase64Png()` read the rendered image with `fetch` on a `data:` URL. If your app has a Content Security Policy, its `connect-src` must allow `data:`, or both reject.

## Uploading or embedding an image

Use `getBase64Png()` to send a PNG to a server or put it in an `<img>`, and `getSvg()` when you need a vector image, for example in a PDF or a slide.

```tsx
const png = await chartRef.current?.getBase64Png();
await fetch('/api/reports/attachments', { method: 'POST', body: JSON.stringify({ image: png }) });
```
