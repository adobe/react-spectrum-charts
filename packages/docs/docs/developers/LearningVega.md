# Learning Vega: A Developer's Guide

Welcome to Vega! This guide will help you learn Vega, a powerful declarative language for creating, saving, and sharing interactive data visualizations. Vega is the foundation that powers React Spectrum Charts, so understanding it will help you create more sophisticated and customized charts.

## Essential Resources

### 📚 Documentation

- **[Vega Documentation](https://vega.github.io/vega/docs/)** - The official Vega documentation
- **[Vega Examples](https://vega.github.io/vega/examples/)** - Comprehensive collection of Vega examples

### 🛠️ Tools

- **[Vega Editor](https://vega.github.io/editor/)** - Online editor for creating and testing Vega specifications

### 📖 Learning Materials

- **[Vega Tutorial](https://vega.github.io/vega/tutorials/)** - Official tutorial series

## Key Concepts

Before diving into challenges, let's understand the fundamental concepts:

### 1. **Data**

- The foundation of any visualization
- Can be inline arrays, URLs, or generated data
- Supports various formats: JSON, CSV, TSV, etc.
- For `react-spectrum-charts` we only just JSON format

### 2. **Scales**

- Map data values to visual properties (position, color, size)
- Types: linear, ordinal, time, band, point, etc.

### 3. **Marks**

- Visual elements that represent data
- Types: rect (bars), line, area, point, text, etc.

### 4. **Encodings**

- Connect data fields to visual properties
- Examples: x, y, color, size, shape

### 5. **Axes**

- Visual guides for scales
- Can be customized with labels, ticks, grid lines

### 6. **Legends**

- Explain visual encodings (colors, sizes, shapes)

## Hands-On Challenges

### Challenge 1: Your First Bar Chart

**Objective**: Create a simple bar chart and understand basic Vega concepts.

**Step 1**: Open the [Vega Editor](https://vega.github.io/editor/) and start with this basic bar chart:

```json
{
  "width": 400,
  "height": 200,
  "data": [
    {
      "name": "table",
      "values": [
        { "category": "A", "amount": 28 },
        { "category": "B", "amount": 55 },
        { "category": "C", "amount": 43 },
        { "category": "D", "amount": 91 },
        { "category": "E", "amount": 81 }
      ]
    }
  ],
  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "domain": { "data": "table", "field": "category" },
      "range": "width",
      "padding": 0.2
    },
    {
      "name": "yscale",
      "type": "linear",
      "domain": { "data": "table", "field": "amount" },
      "range": "height"
    }
  ],
  "marks": [
    {
      "type": "rect",
      "from": { "data": "table" },
      "encode": {
        "enter": {
          "x": { "scale": "xscale", "field": "category" },
          "width": { "scale": "xscale", "band": 1 },
          "y": { "scale": "yscale", "field": "amount" },
          "y2": { "scale": "yscale", "value": 0 },
          "fill": { "value": "steelblue" }
        }
      }
    }
  ]
}
```

**Step 2**: **Challenge - Change Bar Colors**

- Modify the `fill` property in the marks section
- Try different colors: `"red"`, `"green"`, `"#ff6b6b"`, `"rgb(100, 200, 100)"`
- **Bonus**: Make each bar a different color based on the category

**Step 3**: **Challenge - Add Axes**

- Add `axes` array to your specification
- Create an x-axis and y-axis
- Customize axis labels and styling

**Step 4**: **Challenge - Add a Title**

- Add a `title` property to your specification
- Try different title positions and styling

### Challenge 2: Horizontal Bar Chart

**Objective**: Transform your vertical bar chart into a horizontal one.

**Step 1**: Start with your completed bar chart from Challenge 1

**Step 2**: **Challenge - Switch Orientation**

- Swap the x and y scales
- Change `xscale` to use `amount` field and `yscale` to use `category` field
- Update the mark encoding to use the new scales
- Adjust the `width` and `height` properties if needed

**Step 3**: **Challenge - Add Data Labels**

- Add text marks to display the amount values on each bar
- Position the labels inside or outside the bars

### Challenge 3: Line Chart

**Objective**: Create a line chart to understand continuous data visualization.

**Step 1**: Use this data structure:

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        { "month": "Jan", "sales": 20 },
        { "month": "Feb", "sales": 35 },
        { "month": "Mar", "sales": 28 },
        { "month": "Apr", "sales": 45 },
        { "month": "May", "sales": 52 },
        { "month": "Jun", "sales": 48 }
      ]
    }
  ]
}
```

**Step 2**: **Challenge - Create Line Chart**

- Replace the `rect` mark with a `line` mark
- Use `x` and `y` encodings for the line path
- Add `point` marks to show data points

**Step 3**: **Challenge - Add Area**

- Add an `area` mark below the line
- Use gradient fill for the area
- Make the area semi-transparent

### Challenge 4: Scatter Plot

**Objective**: Create a scatter plot to understand point-based visualizations.

**Step 1**: Use this data:

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        { "x": 10, "y": 20, "size": 5 },
        { "x": 15, "y": 35, "size": 8 },
        { "x": 20, "y": 25, "size": 3 },
        { "x": 25, "y": 45, "size": 10 },
        { "x": 30, "y": 30, "size": 6 }
      ]
    }
  ]
}
```

**Step 2**: **Challenge - Create Scatter Plot**

- Use `point` marks instead of `rect` or `line`
- Encode `x`, `y`, and `size` properties
- Add different shapes and colors

**Step 3**: **Challenge - Add Interactivity**

- Add `hover` encoding to change point appearance on mouse over
- Add tooltips to show data values

### Challenge 5: Multi-Series Chart

**Objective**: Create a chart with multiple data series.

**Step 1**: Use this multi-series data:

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        { "month": "Jan", "product": "A", "sales": 20 },
        { "month": "Feb", "product": "A", "sales": 35 },
        { "month": "Mar", "product": "A", "sales": 28 },
        { "month": "Jan", "product": "B", "sales": 15 },
        { "month": "Feb", "product": "B", "sales": 25 },
        { "month": "Mar", "product": "B", "sales": 32 }
      ]
    }
  ]
}
```

**Step 2**: **Challenge - Grouped Bar Chart**

- Create bars grouped by product
- Use different colors for each product
- Add a legend to distinguish between products

**Step 3**: **Challenge - Line Chart with Multiple Series**

- Create separate lines for each product
- Use different colors and line styles
- Add a legend

### Challenge 6: Advanced Features

**Objective**: Explore advanced Vega features.

**Challenge 1 - Transforms**

- Add a `transform` to your data
- Try `aggregate`, `filter`, `sort`, or `window` transforms
- Create a running total or moving average

**Challenge 2 - Legends**

- Add a `legends` array to your specification
- Customize legend position, orientation, and styling
- Create multiple legends for different encodings

**Challenge 3 - Interactions**

- Add `signals` for interactive features
- Create zoom and pan functionality
- Add click handlers to update the visualization

## Tips for Success

### 1. **Start Simple**

- Begin with basic charts and gradually add complexity
- Use the Vega Editor's real-time preview
- Test each change incrementally

### 2. **Understand the Data Flow**

- Data → Scales → Marks → Visual Output
- Each step transforms the data for the next

### 3. **Use the Documentation**

- Keep the [Vega documentation](https://vega.github.io/vega/docs/) open
- Reference the [examples gallery](https://vega.github.io/vega/examples/) for inspiration
- Use the [Vega Editor](https://vega.github.io/editor/) for experimentation

### 4. **Debug Effectively**

- Use the Vega Editor's error messages
- Check the browser console for detailed errors
- Use the [Vega Debugger](https://vega.github.io/vega/docs/debugging/) for complex issues

### 5. **Practice Regularly**

- Try recreating charts you see in the wild
- Experiment with different data types
- Build a portfolio of your Vega creations

## Next Steps

Once you've completed these challenges:

1. **Study Real Examples**: Analyze complex examples in the gallery
2. **Build Your Own**: Create visualizations for your own data
3. **Integrate with React Spectrum Charts**: Apply your Vega knowledge to customize RSC components

## Common Pitfalls

- **Scale Domain**: Always ensure your scale domains match your data
- **Data Types**: Be careful with string vs number data types
- **Nested Objects**: Use dot notation for nested data fields
- **Performance**: Large datasets may require data transforms for better performance

## Additional Resources

- **[Vega GitHub Repository](https://github.com/vega/vega)** - Source code and issues
- **[Vega Community](https://github.com/vega/vega/discussions)** - Community discussions
- **[Vega Blog](https://medium.com/vega/vega-blog)** - Articles and tutorials

Happy visualizing! 🎨📊
