# Color palettes

This page lists the palettes you can pass to `colors` on `Chart`. To set the palette, the color scheme, or your own colors, see [Colors and theming](/react-spectrum-charts/s2/docs/docs/guides/colors-and-theming).

## Categorical

Use categorical colors for series that have no order, like products or regions. Series get the colors in order, starting at A.

Each categorical color is a color from the [Spectrum 2 color palette](https://spectrum.adobe.com/page/color-palette/), like `indigo-1100`, and uses that color's light or dark value to match the chart's `colorScheme`.

| Category | Token | Spectrum color | Light | Dark |
| --- | --- | --- | --- | --- |
| A | `categorical-100` | `indigo-1100` | `#5424DB` | `#99A1FF` |
| B | `categorical-200` | `magenta-900` | `#D92361` | `#FF3377` |
| C | `categorical-300` | `orange-700` | `#E86A00` | `#B94900` |
| D | `categorical-400` | `blue-700` | `#5D89FF` | `#345BF8` |
| E | `categorical-500` | `purple-900` | `#9A47E2` | `#AD69E9` |
| F | `categorical-600` | `pink-700` | `#F24CB8` | `#C4278A` |
| G | `categorical-700` | `seafoam-700` | `#0BA286` | `#067A67` |
| H | `categorical-800` | `fuchsia-1000` | `#9C28AF` | `#E85BFD` |
| I | `categorical-900` | `green-1000` | `#036E45` | `#0EAF62` |
| J | `categorical-1000` | `celery-700` | `#52A119` | `#3C7A0F` |
| K | `categorical-1100` | `red-700` | `#FF513D` | `#CD2E1D` |
| L | `categorical-1200` | `cyan-1000` | `#046691` | `#269FF4` |
| M | `categorical-1300` | `silver-1200` | `#424242` | `#BEBEBE` |
| N | `categorical-1400` | `turquoise-1000` | `#056B74` | `#0DA8B6` |
| O | `categorical-1500` | `cinnamon-700` | `#C67E58` | `#A35834` |
| P | `categorical-1600` | `yellow-1000` | `#865500` | `#CB8D00` |
| Q | `categorical-1700` | `blue-1000` | `#274DEA` | `#6995FE` |
| R | `categorical-1800` | `seafoam-1000` | `#056C5C` | `#0CAD8E` |
| S | `categorical-1900` | `pink-500` | `#FF94DB` | `#8F1261` |
| T | `categorical-2000` | `red-1200` | `#811B0E` | `#FFA79D` |

There are four categorical palettes. Each one uses the first colors above, in order:

| Palette | Colors |
| --- | --- |
| `s2Categorical6` | A to F |
| `s2Categorical12` | A to L |
| `s2Categorical16` | A to P |
| `s2Categorical20` (default) | A to T |

Pick the smallest palette that covers your series. Colors repeat when there are more series than colors. To use one color on its own, pass its token: A is `categorical-100`, B is `categorical-200`, and so on, so `colors={['categorical-400']}` uses D.

## Sequential

> **Warning:**
> 
> Sequential and diverging palettes use the same colors in light and dark. Their colors in each theme are under review and expected to change.

Use sequential palettes for ordered values, like low to high. Each palette runs from light to dark, and the number at the end of the name is how many steps it has.

| Palette | Colors, in order |
| --- | --- |
| `sequentialViridis5` | rgb(253, 231, 37), rgb(122, 209, 81), rgb(31, 152, 139), rgb(57, 86, 140), rgb(68, 1, 84) |
| `sequentialViridis9` | rgb(253, 231, 37), rgb(210, 226, 27), rgb(122, 209, 81), rgb(53, 183, 121), rgb(31, 152, 139), rgb(42, 120, 142), rgb(57, 86, 140), rgb(71, 47, 125), rgb(68, 1, 84) |
| `sequentialViridis16` | rgb(253, 231, 37), rgb(210, 226, 27), rgb(165, 219, 54), rgb(122, 209, 81), rgb(84, 197, 104), rgb(53, 183, 121), rgb(34, 168, 132), rgb(31, 152, 139), rgb(35, 136, 142), rgb(42, 120, 142), rgb(49, 104, 142), rgb(57, 86, 140), rgb(65, 68, 135), rgb(71, 47, 125), rgb(72, 26, 108), rgb(68, 1, 84) |
| `sequentialMagma5` | rgb(254, 159, 109), rgb(252, 253, 191), rgb(196, 60, 117), rgb(87, 21, 126), rgb(0, 0, 4) |
| `sequentialMagma9` | rgb(252, 253, 191), rgb(253, 222, 160), rgb(254, 159, 109), rgb(241, 96, 93), rgb(196, 60, 117), rgb(140, 41, 129), rgb(87, 21, 126), rgb(32, 17, 75), rgb(0, 0, 4) |
| `sequentialMagma16` | rgb(252, 253, 191), rgb(253, 222, 160), rgb(254, 191, 132), rgb(254, 159, 109), rgb(250, 127, 94), rgb(241, 96, 93), rgb(222, 73, 104), rgb(196, 60, 117), rgb(168, 50, 125), rgb(140, 41, 129), rgb(114, 31, 129), rgb(87, 21, 126), rgb(59, 15, 112), rgb(32, 17, 75), rgb(11, 9, 36), rgb(0, 0, 4) |
| `sequentialRose5` | rgb(252, 175, 203), rgb(255, 244, 222), rgb(230, 75, 172), rgb(137, 34, 130), rgb(0, 16, 102) |
| `sequentialRose9` | rgb(255, 244, 222), rgb(255, 221, 216), rgb(252, 175, 203), rgb(243, 128, 188), rgb(230, 75, 172), rgb(185, 52, 149), rgb(137, 34, 130), rgb(85, 22, 114), rgb(0, 16, 102) |
| `sequentialRose16` | rgb(255, 244, 222), rgb(255, 221, 216), rgb(255, 198, 210), rgb(252, 175, 203), rgb(248, 152, 196), rgb(243, 128, 188), rgb(137, 103, 180), rgb(230, 75, 172), rgb(208, 62, 160), rgb(185, 52, 149), rgb(161, 42, 139), rgb(137, 34, 130), rgb(112, 28, 122), rgb(85, 22, 114), rgb(55, 18, 108), rgb(0, 16, 102) |
| `sequentialCerulean5` | rgb(113, 213, 202), rgb(234, 255, 241), rgb(48, 145, 170), rgb(29, 76, 129), rgb(24, 0, 85) |
| `sequentialCerulean9` | rgb(234, 255, 241), rgb(201, 241, 228), rgb(113, 213, 202), rgb(88, 180, 185), rgb(48, 145, 170), rgb(36, 110, 150), rgb(29, 76, 129), rgb(27, 41, 109), rgb(24, 0, 85) |
| `sequentialCerulean16` | rgb(234, 255, 241), rgb(201, 241, 228), rgb(167, 227, 215), rgb(113, 213, 202), rgb(108, 197, 192), rgb(88, 180, 185), rgb(68, 162, 177), rgb(48, 145, 170), rgb(40, 128, 160), rgb(36, 110, 150), rgb(33, 93, 139), rgb(29, 76, 129), rgb(28, 59, 119), rgb(27, 41, 109), rgb(26, 22, 98), rgb(24, 0, 85) |
| `sequentialForest5` | rgb(166, 223, 115), rgb(255, 255, 224), rgb(76, 166, 88), rgb(30, 106, 72), rgb(0, 49, 58) |
| `sequentialForest9` | rgb(255, 255, 224), rgb(226, 245, 189), rgb(166, 223, 115), rgb(121, 195, 101), rgb(76, 166, 88), rgb(49, 136, 79), rgb(30, 106, 72), rgb(14, 77, 65), rgb(0, 49, 58) |
| `sequentialForest16` | rgb(255, 255, 224), rgb(226, 245, 189), rgb(197, 234, 153), rgb(166, 223, 115), rgb(143, 209, 108), rgb(121, 195, 101), rgb(98, 181, 94), rgb(76, 166, 88), rgb(59, 151, 82), rgb(49, 136, 79), rgb(40, 121, 76), rgb(30, 106, 72), rgb(21, 91, 69), rgb(14, 77, 65), rgb(7, 63, 62), rgb(0, 49, 58) |

## Diverging

> **Warning:**
> 
> Sequential and diverging palettes use the same colors in light and dark. Their colors in each theme are under review and expected to change.

Use diverging palettes for values above and below a midpoint, like change from a target. The middle step marks the midpoint.

| Palette | Colors, in order |
| --- | --- |
| `divergentOrangeYellowSeafoam5` | rgb(88, 0, 0), rgb(221, 134, 41), rgb(255, 255, 224), rgb(62, 168, 166), rgb(0, 44, 45) |
| `divergentOrangeYellowSeafoam9` | rgb(88, 0, 0), rgb(156, 69, 17), rgb(221, 134, 41), rgb(254, 214, 147), rgb(255, 255, 224), rgb(187, 228, 209), rgb(62, 168, 166), rgb(7, 103, 105), rgb(0, 44, 45) |
| `divergentOrangeYellowSeafoam15` | rgb(88, 0, 0), rgb(121, 38, 11), rgb(156, 69, 17), rgb(189, 101, 26), rgb(221, 134, 41), rgb(245, 173, 82), rgb(254, 214, 147), rgb(255, 255, 224), rgb(187, 228, 209), rgb(118, 199, 190), rgb(62, 168, 166), rgb(32, 130, 136), rgb(7, 103, 105), rgb(0, 73, 75), rgb(0, 44, 45) |
| `divergentRedBlue5` | rgb(73, 2, 30), rgb(222, 111, 134), rgb(250, 240, 255), rgb(96, 149, 201), rgb(12, 27, 75) |
| `divergentRedBlue9` | rgb(73, 2, 30), rgb(158, 43, 70), rgb(222, 111, 134), rgb(247, 196, 217), rgb(250, 240, 255), rgb(199, 209, 241), rgb(96, 149, 201), rgb(41, 83, 143), rgb(12, 27, 75) |
| `divergentRedBlue15` | rgb(73, 2, 30), rgb(114, 21, 50), rgb(158, 43, 70), rgb(202, 67, 92), rgb(222, 111, 134), rgb(236, 155, 176), rgb(247, 196, 217), rgb(250, 240, 255), rgb(199, 209, 241), rgb(147, 179, 221), rgb(96, 149, 201), rgb(51, 118, 177), rgb(41, 83, 143), rgb(24, 56, 111), rgb(12, 27, 75) |
| `divergentRedYellowBlue5` | rgb(73, 2, 30), rgb(226, 122, 101), rgb(255, 255, 225), rgb(90, 159, 184), rgb(17, 27, 76) |
| `divergentRedYellowBlue9` | rgb(73, 2, 30), rgb(163, 41, 72), rgb(226, 122, 101), rgb(249, 212, 175), rgb(255, 255, 225), rgb(189, 226, 208), rgb(90, 159, 184), rgb(32, 89, 148), rgb(17, 27, 76) |
| `divergentRedYellowBlue15` | rgb(73, 2, 30), rgb(116, 20, 51), rgb(163, 41, 72), rgb(196, 82, 87), rgb(226, 122, 101), rgb(239, 168, 133), rgb(249, 212, 175), rgb(255, 255, 225), rgb(189, 226, 208), rgb(139, 192, 196), rgb(90, 159, 184), rgb(60, 123, 166), rgb(32, 89, 148), rgb(24, 57, 112), rgb(17, 27, 76) |
