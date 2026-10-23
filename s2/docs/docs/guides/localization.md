# Localization

`locale` on `Chart` sets how the chart formats numbers and dates. It doesn't translate text: the strings you pass, like titles and labels, are shown as-is, and the chart's own strings are in English.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={guideMonthlyRevenueData} locale="de-DE">
  <Axis position="left" grid numberFormat="currency" />
  <Axis position="bottom" baseline labelFormat="time" granularity="month" />
  <Line metric="revenue" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `locale` on `Chart`: `en-US`, `de-DE`, `fr-FR`, `ja-JP`, `pt-BR` or `zh-CN`. Shown: `de-DE`.
-   `numberFormat` on `Axis`: `shortNumber`, `standardNumber`, `currency` or `shortCurrency`. Shown: `currency`.

The example uses `guideMonthlyRevenueData`:

```ts
const guideMonthlyRevenueData = [
  { datetime: '2025-01-01T00:00:00', revenue: 1184500.5 },
  { datetime: '2025-02-01T00:00:00', revenue: 1092300.25 },
  { datetime: '2025-03-01T00:00:00', revenue: 1257800.75 },
  { datetime: '2025-04-01T00:00:00', revenue: 1310200 },
  { datetime: '2025-05-01T00:00:00', revenue: 1388900.5 },
  { datetime: '2025-06-01T00:00:00', revenue: 1452100.25 },
];
```

## Setting the locale

`locale` defaults to `en-US` and takes one of three forms.

**A locale code** sets both number and time formats:

```tsx
<Chart data={data} locale="de-DE">
```

See [`LocaleCode`](https://github.com/adobe/react-spectrum-charts/blob/main/packages/locales/src/locale.types.ts) for the supported codes. A code the chart doesn't have falls back to `en-US`.

**Separate number and time locales** let you mix them, or use a code that only has one of the two:

```tsx
<Chart data={data} locale={{ number: 'en-IN', time: 'en-GB' }}>
```

Some codes have only number formats or only time formats. See `NumberLocaleCode` and `TimeLocaleCode` in [the locale types](https://github.com/adobe/react-spectrum-charts/blob/main/packages/locales/src/locale.types.ts).

**Custom definitions** cover a locale that isn't listed, or a variation of one. Pass a [d3-format locale](https://d3js.org/d3-format#formatLocale) as `number`, a [d3-time-format locale](https://d3js.org/d3-time-format#timeFormatLocale) as `time`, or mix a definition with a code:

```tsx
<Chart
  data={data}
  locale={{
    number: { decimal: '.', thousands: "'", grouping: [3], currency: ['', '\u00a0CHF'] },
    time: 'de-CH',
  }}
>
```

> **Note:**
> 
> `shortNumber` uses the browser's [compact number format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat#notation), not the d3 definition, for suffixes like K and M. With a custom `number` definition, it uses the browser's language for the suffixes and your definition's decimal symbol.

## What the locale formats

The locale applies wherever the chart formats a value itself:

-   Axis labels: number formats like `standardNumber`, `shortNumber`, and `currency`, duration labels, and month and day names on time axes. See [Label formats](/react-spectrum-charts/s2/docs/docs/axis#label-formats).
-   Labels on marks, like `Bar` value labels and `Donut` segment labels.
-   Default `Donut` tooltip and popover content.

Content you render yourself in `ChartInspect`, `ChartPopover`, or custom axis labels isn't formatted by the chart. Format it with the same locale, for example with `Intl.NumberFormat` or `toLocaleString`:

```tsx
const euros = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

<ChartInspect>{(datum) => <div>{euros.format(datum.revenue)}</div>}</ChartInspect>;
```

Dates are shown in the browser's time zone, whatever the locale. Pass dates as epoch milliseconds or ISO strings.

## Currency

`numberFormat="currency"` and `numberFormat="shortCurrency"` on `Axis` use the locale's currency symbol and its position, so `de-DE` writes `1.200.000,00 €`. The symbol comes from the locale, not the data: switch `locale` and the symbol changes too.

To show a currency that doesn't match the locale, like euros with US number formatting, set `currencyCode` and `currencyLocale` on `Axis`. Both are required, and they only apply with `numberFormat="currency"` or a fixed-decimal format like `,.0f`:

```tsx
<Chart data={data} locale="en-US">
  <Axis position="left" numberFormat="currency" currencyCode="EUR" currencyLocale="de-DE" />
  <Line metric="revenue" />
</Chart>
```

`currencyLocale` sets where the symbol goes, and the chart's `locale` still sets the separators. Support for these props is limited; see [Number formats](/react-spectrum-charts/s2/docs/docs/axis#number-formats).

## Translating text

The chart shows your strings as you pass them, so translate them before passing them in. These include `title` and `description` on `Chart`, axis and legend titles, legend labels and descriptions, and the content of `ChartInspect` and `ChartPopover`.

The chart's own strings are in English:

-   The empty state says "No data found". Pass a translated `emptyStateText`:
    
    ```tsx
    <Chart data={[]} emptyStateText="Keine Daten gefunden">
    ```
    
-   The loading indicator's accessible label is "Loading", and `ChartActionBar` labels its toolbar, drag handle, and **More actions** menu in English. These strings can't be changed.
    

Data values, like series names, appear in legends and tooltips as they are in `data`. Translate them in the data, or map them with `labels` on [Legend](/react-spectrum-charts/s2/docs/docs/legend#labels).
