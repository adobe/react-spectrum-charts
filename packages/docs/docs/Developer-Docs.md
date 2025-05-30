# Developer Docs

## What is `react-spectrum-charts`?

`react-spectrum-charts` is a react visualization library built on [Vega](https://vega.github.io/vega/). `react-spectrum-charts` uses a declarative approach to convert react components and properties into a spectrum-styled vega visualization (Chart: `(data) => spectrum visualization`).

## How it works

At its simplest, the Chart component is a single react component that takes in props and uses those to render a vega visualization.

"Single react component you say? What about Bar, Axis, Legend etc?"

I'm glad you asked! Technically all the react components that you can pass into the Chart component as children don't render any react components. Instead, these are just a cleaner way of defining more complicated props for Chart.

We could just have a single component for creating a bar chart like so:

```
<Chart type="stacked-bar" data={data} orientation="horizontal" axis="bottom"/>
```

This could work but it would get very cumbersome very quick as the complexity of the chart increases. For example, let's say you wanted to have a line and a bar on the same chart. Does this mean we also need a `type="combo"`? Or what if we want a line that has an area chart behind it showing the standard deviation?

Another downside of this method is the props become ambiguous or require really long verbose names to describe what they do. `orientation` is a great example of this. What is this referring to? Is this how the bar should be oriented, or where the legend should be?

Another option would be to accept a spec JSON object that defines all the desired properties of the visualization like [Vega-lite](https://vega.github.io/vega-lite/). But we can do better than this...

### Collection Component

A more elegant solution is for Chart to be a [collection component](https://react-spectrum.adobe.com/react-stately/collections.html). A collection component accepts both props and react components as children (which are also technically props).

Back to our bar example, by using Chart as a collection component, we get the following:

```
<Chart data={data}>
    <Axis position="bottom" />
    <Bar orientation="horizontal" />
</Chart>
```

Building our visualization this way makes it far more readable and more composable. For example, what if we revisit the complex example above where we have a line plot with an area behind it to represent the standard deviation. Also to complicate things further, lets add a 7 day moving average to the line?

```
<Chart data={data}>
    <Area metricStart='lowerBound' metricEnd='upperBound' opacity={0.2} />
    <Line metric="mean" trendline="moving-7" />
</Chart>
```

Now we are talking. You can see that with Chart as a collection component, we get highly configurable visualizations with minimal code that is still very readable. Win, win, win.

### Pseudo Components

Ultimately, all chart visualizations get converted to a vega spec. A vega spec is a complex JSON object that defines the visualization. This means that even though child components like `Axis` and `Bar` can be passed into Chart, there aren't any actual `Axis` or `Bar` components that get rendered to the DOM.

Instead, these child components are treated as complex props that get represented in the final vega spec that gets rendered by Chart. Since the child components of Chart do not actually get rendered, these are referred to as "Pseudo Components".

"If it's not a real React component, how do I create a pseudo component in the library?"

It's really simple. This is the Bar component from `Bar.tsx` file:

```
import { BarProps } from '../types';

export function Bar({ dimension = 'category', color = 'series', metric = 'value', opacity = 1 }: BarProps) {
	return null;
}
```

You can see that `Bar` follows the pascal-case naming convention of a react component. It also accepts a props object as an input just like any other react component. In this example you can see that we spread the props and define all defaults. This is not required but is recommended since it allows storybook to pick up the available props and all the default values automatically.

"Cool but... this feels hacky."

This may seem hacky at first glance but this pattern is common practice in libraries. For example, this is exactly how react-spectrum handles children of collection components like TableView and Menu ([TableHeader](https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/table/src/TableHeader.ts#L17-L19) example).

"Well if the child components are just pseudo components, then what's real?"

Great questions. Introducing the spec builder.

### Spec Builder

The Chart takes all the props, children and the children's props and uses those to compose a valid vega spec. The spec builder is what does this.

The spec builder uses the functional programming pattern. This was chosen for predictability and testability.

#### Predictability

Functional programming doesn't allow side effects. Since Chart is simply building a spec file and using it to display a vega visualization, there isn't a need for side effects.

#### Testability

The final output of Chart is a vega visualization. This means integration and end-to-end testing isn't always trivial. This increases the need for strong unit testing which functional programming excels at.

#### Decoupled Children

To keep Chart extensible and easy to develop in. The child components are used to build the final spec independently of one another, keeping them decoupled. For example, `addBar()` only accepts the initial state of the spec and bar props as inputs. For some controlled behavior, we may pass in some props from the Chart, but none of the Axis props or other component props are accessible from within `addBar()`.

```
spec = [...children]
    .sort((a, b) => buildOrder[a.type.name] - buildOrder[b.type.name])
    .reduce((acc: Spec, cur) => {
        const type = cur.type.name;
        switch (type) {
            case 'Axis':
                return addAxis(acc, (cur as AxisElement).props);
            case 'Bar':
                return addBar(acc, (cur as BarElement).props);
            case 'Line':
                return addLine(acc, (cur as LineElement).props);
            case 'Legend':
                return addLegend(acc, (cur as LegendElement).props);
            default:
                console.error('invalid type');
                return acc;
        }
    }, spec);
```

## Best Practices

### Functional Programming

The spec builder implements a functional programming pattern. This means that functions must be immutable and cannot have any side effects.

#### Setters

A setter is a pure function that takes in an initial state and some arguments and returns a new modified copy of the initial state based on the arguments. Setters should match this pattern:

```
const set{{Property}} = <T>(initState: T, args: Args): T => {
    const stateCopy = {...initState};
    // ...
    // stateCopy.property = arg;
    // ...
    return stateCopy;
}
```

Notice that the initial state gets copied and then the copy gets modified. This is because we have to maintain immutability.

One tricky thing is even though we are spreading the initState to create a copy, this doesn't create a deep copy of the original. So if we need to edit deeply nested properties, that will also modify the original state and we are no longer immutable!

An easy fix for this is to use [immer](https://immerjs.github.io/immer/). Here we wrap the function above in immer's produce function. The inputs are [curried](https://immerjs.github.io/immer/curried-produce) to our function:

```
import produce from 'immer';

const set{{Property}} = produce<T, [Args]>((initState, args) => {
    // ...
    // initState.property = arg;
    // ...
    return initState;
})
```

Notice that we don't need to copy the initState anymore. We can write normal mutable code and still maintain immutability. Immer outlines the recommended [update patterns](https://immerjs.github.io/immer/update-patterns) and common [pitfalls](https://immerjs.github.io/immer/pitfalls) in their documentation. Please follow these recommendations and avoid the pitfalls outlined.

#### Getters

A getter is a pure function that takes in some arguments and returns a value. Unlike setters, getters don't require an initial state. There also isn't any need to wrap getters in immer because they shouldn't be implementing any code that would mutate an object regardless of immer.

Example:

```
function getTooltip(children: DialogElement[]): ProductionRule<StringValueRef> | undefined {
	if (children.length) {
		return { signal: 'datum' };
	}
}
```

### Decoupled Child Components

Each of the child components of Chart (ex. Bar, Line, Legend etc.) should be kept independent of one another. In practice, this means, when calling `addBar()`, the only arguments allowed are the initial state and bar props. We don't want to pass in any of the props from Legend or Chart to `addBar()`.

Sometimes one child will have some functionality that impacts another child. A great example of this is Legend. Legend supports a `highlight` prop. If true, when the user hovers over a legend item, the corresponding series will be highlighted in the chart (typically by lowering the opacity of all other series).

So how do we keep Legend decoupled from Bar and Line. The way we do this is by building the spec in a specific order. By making sure that Bar and Line get added to the spec before Legend, the `addLegend()` setter can traverse the `spec.marks` looking for any marks that should be highlighted and modify those marks directly in the spec. This keeps the two independent of one another but still allows us to support properties that affect multiple components.

It is very important to keep the children decoupled because it keeps the code base easy to work in and prevents it from turning into spaghetti. It's also critical for keeping Chart highly composable.

## Common Dev Workflow

With any new `react-spectrum-charts` request, the following workflow is typically followed. Some steps may be skipped depending on how simple the request is.

As an example for this workflow, we will go through the process of enhancing the legend symbols to default to rounded squares instead of circles (the vega default).

### Review the Vega documentation

Since `react-spectrum-charts` builds all the charts in vega, typically the first step in a new feature request is figuring out how to implement the feature request in vega. The best resource for learning how to implements something is the [vega documentation](https://vega.github.io/vega/docs/).

Another good resource is to look through the [vega examples](https://vega.github.io/vega/examples/) for a solution that is close to the desired feature request. Each example has the full spec that can be reviewed. Each example also has a link that will open the example in the [vega editor](https://vega.github.io/editor/#/edited).

### Try implementing the feature in the vega editor

The [vega editor](https://vega.github.io/editor/#/edited) is a live playground that allows you to try out altering a vega spec and observing the result. It is typically a good practice to find an example that is close to desired feature request, open that in vega editor and then attempt to modify it to implement the feature.

It is highly recommended to take the time to fully understand each property in the spec. There are often multiple ways to accomplish the same thing in vega, so take the time to understand them so the best solution can be implemented in ``react-spectrum-charts``.

### Modify a `react-spectrum-charts` spec in the vega editor

Now that the correct way to implement the desired feature has been identified, it is often helpful to pull in a `react-spectrum-charts` vega spec and attempt to implement the feature.

Note that `react-spectrum-charts` uses a config option to override many of the vega defaults. This means that what is displayed in the vega editor will not match one-to-one with what displays in storybook. Config options are strictly cosmetic so they should have minimal impact.

#### How to pull a `react-spectrum-charts` generated vega spec into the vega editor

1. Find or write a story that can be a starting point for implementing this feature
2. On the story, add the `debug` property to the `Chart` component
   ```
   <Chart {...chartProps} debug>
   ```
3. Start storybook by running `yarn storybook`
4. In storybook, open the console in the dev tools
5. Open the story that was modified in storybook
6. The spec for that story will be printed to the console
7. Copy the entire spec and paste it into the [vega editor](https://vega.github.io/editor/#/edited)
8. Add the following to the top of the spec
   ```
   "width": 600,
   "height": 600,
   ```
9. The `react-spectrum-charts` generated spec should be displaying in the vega editor now.

### Implement in Chart

Now that the spec changes required to add the desired feature are identified, time to try it on the real thing. For this step, please follow all of the best practices called out above (or the PR will not be approved).

It's typically best to dev using storybook.

Please make sure code is well commented so that others will understand why the feature was implemented the way that it was.

### Update test and write new tests

Now that the feature is working and all is right in the world, make sure that the new code is adequately tested. ``react-spectrum-charts`` requires 60% code coverage for all new lines of code. Typically if the coverage is not >90%, the PR will not be approved.

To verify that all existing test still pass, run either `yarn test` or `yarn watch`. It's also possible to pass in a regex to run a subset of tests (`yarn watch legendSpecBuilder.test`). Without a regex, all tests will be run.

### Submit a PR

Now that the new feature is implemented and tested, it's time to submit a PR.

## Linking your local react-spectrum-charts package to another local package.

There are a number of ways to do this. Yarn link is a common solution. Here are the steps to link using [yalc](https://github.com/wclr/yalc):
1. Install yalc globally. `yarn global add yalc`
2. In the react-spectrum-charts project directory, run `yalc publish`.
3. In the project that you would like to run the local version of react-spectrum-charts in, run `yalc add` with the react-spectrum-charts package name.
4. When you make changes in react-spectrum-charts, run `yalc publish` in the react-spectrum-charts directory. Then, run `yalc update` in your project directory.

