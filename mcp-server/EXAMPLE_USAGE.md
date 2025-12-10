# MCP Server Example Usage

This guide shows how users interact with the React Spectrum Charts MCP server through natural language in AI assistants like Claude or Cursor.

## 📚 Browsing Documentation

### List Available Components

**User:**
> "What chart components are available in React Spectrum Charts?"

**AI Response:** *(Uses `list_rsc_components`)*
> React Spectrum Charts has these components:
> - **Bar** - Bar charts (stacked, dodged, horizontal, vertical)
> - **Line** - Line charts with trend analysis
> - **Area** - Area charts for time series
> - **Scatter** - Scatter plots
> - **Donut** - Donut/pie charts
> - **BigNumber** - KPI displays

---

### Get Component Documentation

**User:**
> "Show me how to create a horizontal bar chart"

**AI Response:** *(Uses `get_rsc_page("Bar")`)*
> Here's how to create a horizontal bar chart:
> ```jsx
> <Chart data={data}>
>   <Axis position="bottom" grid title="Downloads" />
>   <Axis position="left" baseline title="Browser" />
>   <Bar orientation="horizontal" dimension="browser" metric="views" />
> </Chart>
> ```

---

### Get Component Props

**User:**
> "What props does the Bar component accept?"

**AI Response:** *(Uses `get_rsc_page("Bar", "Props")`)*
> The Bar component accepts these props:
> - `dimension` - Data field for categories
> - `metric` - Data field for values
> - `orientation` - "horizontal" or "vertical"
> - `type` - "stacked" or "dodged"
> - `color` - Color series field
> - `paddingRatio` - Spacing between bars
> - `onClick` - Click handler callback

---

## 🚀 Generating Charts

### Simple Bar Chart

**User:**
> "Create a bar chart showing sales by product category"

**AI Response:** *(Uses `create_bar_chart`)*
> Here's a bar chart for your sales data:
> ```tsx
> import { Chart } from '@adobe/react-spectrum-charts';
> import { Axis, Bar, ChartTooltip } from '@adobe/react-spectrum-charts';
> 
> const chartData = [
>   { category: 'Electronics', revenue: 125000 },
>   { category: 'Clothing', revenue: 89000 },
>   { category: 'Home & Garden', revenue: 67000 },
> ];
> 
> export const SalesChart = () => (
>   <Chart data={chartData} width={700} height={450}>
>     <Axis position="bottom" baseline title="Category" />
>     <Axis position="left" grid title="Revenue" />
>     <Bar dimension="category" metric="revenue">
>       <ChartTooltip>
>         {(datum) => <div>{datum.category}: ${datum.revenue}</div>}
>       </ChartTooltip>
>     </Bar>
>   </Chart>
> );
> ```

---

### Stacked Bar Chart

**User:**
> "I need a horizontal stacked bar chart comparing browser usage across operating systems"

**AI Response:** *(Uses `create_bar_chart`)*
> Here's a stacked horizontal bar chart:
> ```tsx
> <Chart data={data}>
>   <Axis position="bottom" grid title="Downloads" />
>   <Axis position="left" baseline title="Browser" />
>   <Bar 
>     orientation="horizontal"
>     type="stacked"
>     dimension="browser" 
>     metric="downloads"
>     color="operatingSystem"
>   />
>   <Legend position="top" title="Operating System" />
> </Chart>
> ```

---

### Grouped Bar Chart

**User:**
> "Create a grouped bar chart for quarterly revenue by region"

**AI Response:** *(Uses `create_bar_chart`)*
> Here's a grouped (dodged) bar chart:
> ```tsx
> <Chart data={quarterlyData}>
>   <Axis position="bottom" baseline title="Quarter" />
>   <Axis position="left" grid title="Revenue" labelFormat="shortNumber" />
>   <Bar 
>     type="dodged"
>     dimension="quarter" 
>     metric="revenue"
>     color="region"
>   />
>   <Legend position="bottom" />
> </Chart>
> ```

---

## 🔍 Searching & Exploring

### Search Documentation

**User:**
> "How do I add tooltips to my chart?"

**AI Response:** *(Uses `search_rsc_docs("tooltip")`)*
> I found documentation about tooltips! Use the `ChartTooltip` component:
> ```jsx
> <Bar dimension="x" metric="y">
>   <ChartTooltip>
>     {(datum) => (
>       <div>
>         <strong>{datum.x}</strong>
>         <div>Value: {datum.y}</div>
>       </div>
>     )}
>   </ChartTooltip>
> </Bar>
> ```

---

### List Packages

**User:**
> "What packages are in the react-spectrum-charts monorepo?"

**AI Response:** *(Uses `list_packages`)*
> The monorepo contains:
> - `@adobe/react-spectrum-charts` - Main chart library
> - `@spectrum-charts/vega-spec-builder` - Vega spec generation
> - `@spectrum-charts/constants` - Shared constants
> - `@spectrum-charts/themes` - Theming support
> - `@spectrum-charts/docs` - Documentation site

---

### Get Repository Structure

**User:**
> "Show me the repository structure"

**AI Response:** *(Uses `get_repo_structure`)*
> The react-spectrum-charts monorepo structure:
> ```
> react-spectrum-charts/
> ├── packages/
> │   ├── react-spectrum-charts/  # Main library
> │   ├── vega-spec-builder/      # Vega specs
> │   ├── constants/              # Shared constants
> │   ├── themes/                 # Theming
> │   └── docs/                   # Documentation
> └── mcp-server/                 # This MCP server
> ```

---

## 💬 Natural Conversation Flow

Here's an example of a multi-turn conversation:

```
User: I'm building a dashboard and need a chart showing monthly revenue

AI: I can help you create that! Here's a bar chart for monthly revenue:
    [generates code using create_bar_chart]
    
    const MonthlyRevenueChart = () => (
      <Chart data={monthlyData} width={700} height={450}>
        <Axis position="bottom" baseline title="Month" />
        <Axis position="left" grid title="Revenue" />
        <Bar dimension="month" metric="value" />
      </Chart>
    );

User: Can you make it horizontal instead?

AI: Sure! Here's the horizontal version:
    [updates orientation]
    
    <Bar 
      dimension="month" 
      metric="value" 
      orientation="horizontal"
    />

User: How do I add a legend?

AI: Add a Legend component. Looking at the docs...
    [uses get_rsc_page to find legend info]
    
    Add this inside your Chart:
    <Legend position="bottom" title="Revenue" />

User: Perfect! What about adding a trend line?

AI: [searches docs for trendline]
    You can add a Trendline component as a child of Bar:
    
    <Bar dimension="month" metric="value">
      <Trendline method="average" />
    </Bar>
    
    Available methods: "average", "median"
```

---

## 🛠️ Available MCP Tools

| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `list_rsc_pages` | List documentation pages | "List all chart documentation" |
| `get_rsc_page_info` | Get page sections | "What sections are in the Bar docs?" |
| `get_rsc_page` | Get page content | "Show me the Bar component docs" |
| `search_rsc_docs` | Search documentation | "How do I add tooltips?" |
| `list_rsc_components` | List all components | "What components are available?" |
| `create_bar_chart` | Generate bar chart code | "Create a sales bar chart" |
| `generate_bar_chart` | Generate with config | "Generate bar chart with custom data" |
| `list_example_data` | Show data templates | "What example data is available?" |
| `list_packages` | List monorepo packages | "What packages exist?" |
| `get_package_info` | Get package details | "Show @adobe/react-spectrum-charts info" |
| `search_files` | Search codebase | "Find all test files" |
| `get_repo_structure` | Show repo overview | "Show repository structure" |

---

## 📝 Tips for Users

1. **Be specific** - "Create a horizontal stacked bar chart" works better than "make a chart"
2. **Ask follow-ups** - The AI remembers context and can iterate on previous responses
3. **Request sections** - "Show me just the Props section" for targeted info
4. **Use natural language** - No need to know the exact tool names

The MCP server handles all tool calls automatically - just chat naturally! 🎉

