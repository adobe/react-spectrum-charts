/**
 * Every design value in this library that the Spectrum 2 chart specs (line.pdf, donut.pdf) do not
 * specify. They are collected here so they can be swapped for official tokens without touching the
 * chart code. Values the specs *do* give (light palette, line widths, type sizes, spacing in the
 * anatomy diagrams) live next to the code that uses them.
 *
 * "Estimated" means the spec shows the value only in a picture, so it was sampled from the image.
 */

// ---------------------------------------------------------------- dark theme
// The specs only show light mode. Dark values keep the light palette's hue order and roughly match
// its contrast on a #1b1b1b canvas.
export const DARK_THEME = {
  background: '#1b1b1b',
  text: '#ebebeb',
  textSecondary: '#b6b6b6',
  axisLabel: '#b6b6b6',
  faded: '#4a4a4a',
  grid: '#393939',
  baseline: '#dbdbdb',
  tick: '#8f8f8f',
  reference: '#ebebeb',
  crosshair: '#dbdbdb',
  neutral: '#8f8f8f',
  positive: '#2fb877',
  negative: '#ff6f61',
  focus: '#6b8cff',
  surface: '#2c2c2c',
  surfaceBorder: '#454545',
  /** Gray remainder segment of binary donuts. */
  secondary: '#5a5a5a',
  /** Rounded background behind a hovered legend entry. */
  legendHover: '#333333',
  palette: ['#8b74ff', '#f2558d', '#f68511', '#7ea2ff', '#bb72f0', '#f779cd'],
  fadeOpacity: 0.25,
  areaOpacity: 0.22,
};

// ---------------------------------------------------------------- light theme gaps
export const LIGHT_EXTRAS = {
  /** Estimated from the binary donut images. */
  secondary: '#c6c6c6',
  /** Estimated from the legend hover image. */
  legendHover: '#ebebeb',
  /** Opacity of de-emphasized series and segments ("fade to ~20% tint"). */
  fadeOpacity: 0.22,
  areaOpacity: 0.16,
};

/** Windows high contrast: de-emphasized marks keep more opacity so they stay visible. */
export const CONTRAST_FADE_OPACITY = 0.4;

// ---------------------------------------------------------------- palettes (estimated)
/** Diverging palette from the ordinal donut example (Strongly agree → Strongly disagree). */
export const DIVERGING_PALETTE = ['#0d6a96', '#2ea7f8', '#f0f0f0', '#ff7a63', '#a0261a'];
/** Sequential purple palette from the semicircle examples, darkest first. */
export const SEQUENTIAL_PALETTE = ['#3d10a8', '#5424db', '#7d5cf0', '#a993f7', '#d3c8fb'];

// ---------------------------------------------------------------- motion
export const MOTION = {
  /** First render: lines sweep left to right, donuts sweep clockwise. */
  revealMs: 700,
  /** Data, size and visibility changes. */
  updateMs: 500,
  revealEase: 'out' as const,
  updateEase: 'inOut' as const,
};

// ---------------------------------------------------------------- chart chrome
export const CHROME = {
  /** Default height when the container has none. */
  defaultHeight: 360,
  minimalHeight: 48,
  /** Outer padding around the scene. */
  padding: 4,
  subtitleFont: 14,
  titleLineHeight: 1.3,
  subtitleLineHeight: 1.4,
  /** Gap between the title block and the legend or plot. */
  titleGap: 12,
  /** Gap between a top/bottom legend and the plot. */
  legendGap: 12,
  /** Gap between a left/right legend and the plot. */
  legendSideGap: 24,
  /** Left/right legends may use at most this share of the width. */
  legendMaxShare: 0.4,
  legendRowGap: 4,
  legendItemGap: 16,
  legendSwatchGap: 8,
  legendItemPadX: 4,
  legendItemHeight: 24,
  legendHoverRadius: 4,
  /** Entries other than the hovered one fade to this opacity. */
  legendFadeOpacity: 0.35,
  /** Continuous (bar) legend. */
  legendBarHeight: 12,
  legendBarMinWidth: 160,
  legendBarMaxWidth: 240,
};

// ---------------------------------------------------------------- tooltip & popover (HTML)
export const TOOLTIP = {
  padding: '8px 12px',
  radius: 8,
  shadow: '0 2px 8px rgba(0,0,0,.16)',
  fontSize: 14,
  minWidth: 120,
  maxWidth: 280,
  swatch: 10,
  /** Gap between the pointer/mark and the tooltip. */
  offset: 16,
};

export const POPOVER = {
  padding: 4,
  radius: 8,
  shadow: '0 4px 16px rgba(0,0,0,.18)',
  offset: 14,
};

// ---------------------------------------------------------------- interaction
export const INTERACTION = {
  /** Extra hit area around a cartesian panel. */
  panelSlack: 12,
  /** Size of the focus target drawn around a keyboard-focused point. */
  pointFocusSize: 16,
  /** Opacity of the background veil that dims x-axis labels while a hover label is shown. */
  axisLabelVeil: 0.65,
};

// ---------------------------------------------------------------- export
export const EXPORT = {
  /** PNG pixel ratio. */
  pngScale: 2,
};

// ---------------------------------------------------------------- donut
export const DONUT = {
  /** Linear gap between segments, in px (spec shows a hairline separator). */
  gap: 2,
  /**
   * Ring thickness by diameter, linearly interpolated. The spec's size grid gives the diameters; the
   * thicknesses are estimated from the images.
   */
  thickness: [
    [60, 12],
    [120, 18],
    [160, 20],
    [200, 24],
    [400, 44],
  ] as [number, number][],
  /**
   * Center typography by diameter (spec gives XS–L; XL is extrapolated). Each row:
   * [min diameter, value font, label font, delta font]. 0 disables that line.
   */
  center: [
    [0, 0, 0, 0],
    [100, 16, 0, 0],
    [140, 24, 12, 0],
    [190, 32, 18, 16],
    [360, 48, 24, 20],
  ] as [number, number, number, number][],
  /** Center text may use this share of the hole's diameter. */
  centerTextShare: 0.82,
  /** Lightweight direct labels. */
  labelNameFont: 12,
  labelValueFont: 14,
  /** Distance from the ring to a direct label. */
  labelOffset: 10,
  /** Leader lines appear when a label is pushed this far from its slice. */
  leaderThreshold: 6,
  /** Advanced labels: swatch size and distance from the ring to the label column. */
  advancedSwatch: 12,
  advancedColumnGap: 24,
  /** Facet label under each donut in a trellis. */
  facetFont: 12,
  facetGap: 8,
  /** Gap between trellis cells. */
  trellisGap: 24,
  /** Benchmark tick: overshoot past the ring and arrowhead size. */
  benchmarkOvershoot: 6,
  benchmarkArrow: 5,
  benchmarkFont: 12,
  /** Selection outline: dark outer stroke over a light inner stroke. */
  selectionOuter: 3,
  selectionInner: 1.5,
  /** Hover label shown outside the ring when there are no direct labels. */
  hoverLabelFont: 14,
  /** Focus ring offset outside the segment. */
  focusOffset: 3,
  /** Advanced direct label fonts (name / percentage / "n out of total") and swatch gap. */
  advancedNameFont: 14,
  advancedValueFont: 16,
  advancedDetailFont: 11,
  advancedSwatchGap: 6,
  /** Pointer slack outside the ring that still counts as a hit, in px. */
  hitSlack: 4,
};
