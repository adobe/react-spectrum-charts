import { CHROME, POPOVER, TOOLTIP } from './assumptions.js';
import { FONT_FAMILY } from './theme.js';

const CSS = `
.s2c-root{--s2c-bg:#fff;--s2c-text:#292929;--s2c-text2:#505050;--s2c-border:#e1e1e1;--s2c-focus:#3b63fb;--s2c-surface:#fff;
  position:relative;display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100%;min-width:0;
  font-family:${FONT_FAMILY};color:var(--s2c-text);background:var(--s2c-bg);-webkit-font-smoothing:antialiased;}
.s2c-root *,.s2c-root *::before,.s2c-root *::after{box-sizing:border-box;}
.s2c-stage{position:relative;flex:1 1 auto;min-width:0;min-height:${CHROME.minimalHeight}px;touch-action:pan-y;-webkit-tap-highlight-color:transparent;}
.s2c-surface{position:absolute;left:0;top:0;display:block;}
.s2c-canvas-stack canvas{position:absolute;left:0;top:0;display:block;}
.s2c-legend-controls{position:absolute;left:0;top:0;width:0;height:0;z-index:1;}
.s2c-legend-controls [role=group]{position:absolute;}
.s2c-legend-hit{position:absolute;display:block;margin:0;padding:0;border:0;border-radius:${CHROME.legendHoverRadius}px;background:transparent;
  color:transparent;font-size:1px;cursor:pointer;}
.s2c-legend-hit[role=img]{cursor:default;}
.s2c-legend-hit:focus{outline:none;}
.s2c-legend-hit:focus-visible{outline:2px solid var(--s2c-focus);outline-offset:1px;}
.s2c-swatch{flex:none;display:inline-block;width:16px;height:16px;border-radius:4px;border:2px solid transparent;}
.s2c-tooltip{position:absolute;z-index:3;pointer-events:none;min-width:${TOOLTIP.minWidth}px;max-width:${TOOLTIP.maxWidth}px;padding:${TOOLTIP.padding};
  border-radius:${TOOLTIP.radius}px;background:var(--s2c-surface);color:var(--s2c-text);border:1px solid var(--s2c-border);box-shadow:${TOOLTIP.shadow};
  font-size:${TOOLTIP.fontSize}px;line-height:1.4;white-space:nowrap;}
.s2c-tooltip[hidden],.s2c-popover[hidden],.s2c-notice[hidden]{display:none;}
.s2c-tt-header{font-weight:700;margin-bottom:4px;}
.s2c-tt-row{display:flex;align-items:center;gap:8px;}
.s2c-tt-row .s2c-swatch{width:${TOOLTIP.swatch}px;height:${TOOLTIP.swatch}px;border-radius:2px;border:0;}
.s2c-tt-name{flex:1;color:var(--s2c-text2);overflow:hidden;text-overflow:ellipsis;}
.s2c-tt-value{font-weight:700;font-variant-numeric:tabular-nums;}
.s2c-tt-total{margin-top:4px;padding-top:4px;border-top:1px solid var(--s2c-border);}
.s2c-popover{position:absolute;z-index:4;padding:${POPOVER.padding}px;border-radius:${POPOVER.radius}px;background:var(--s2c-surface);color:var(--s2c-text);
  border:1px solid var(--s2c-border);box-shadow:${POPOVER.shadow};font-size:14px;}
.s2c-popover:focus{outline:none;}
.s2c-notice{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:8px 12px;border-radius:8px;
  background:color-mix(in srgb,var(--s2c-text) 6%,transparent);font-size:14px;color:var(--s2c-text);}
.s2c-notice-text{flex:1;}
.s2c-notice button{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:4px;
  background:none;color:inherit;font:inherit;font-size:18px;line-height:1;cursor:pointer;}
.s2c-notice button:focus-visible{outline:2px solid var(--s2c-focus);outline-offset:1px;}
.s2c-sr-only{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
.s2c-stage .dn-wrapper{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2;}
.s2c-stage .dn-node{position:absolute;margin:0;pointer-events:none;border-radius:4px;}
.s2c-stage .dn-node:focus{outline:2px solid var(--s2c-focus);outline-offset:2px;}
.s2c-stage .dn-node.s2c-nav-item{border-radius:50%;}
.s2c-stage .dn-node.s2c-nav-chart:focus{outline-offset:4px;}
.s2c-stage .dn-node.s2c-nav-item-path:focus,.s2c-stage .dn-node.s2c-nav-group-path:focus{outline:none;}
.s2c-stage .dn-node-svg{position:absolute;overflow:visible;pointer-events:none;}
.s2c-stage .dn-node-path{fill:none;stroke:none;}
.s2c-stage .dn-node:focus .dn-node-path{stroke:var(--s2c-focus);stroke-width:2px;}
.s2c-stage .dn-node-text{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
@media (forced-colors: active){
  .s2c-swatch,.s2c-tt-row .s2c-swatch{forced-color-adjust:none;}
  .s2c-stage .dn-node:focus,.s2c-legend-hit:focus-visible{outline-color:Highlight;}
  .s2c-stage .dn-node:focus .dn-node-path{stroke:Highlight;}
  .s2c-tooltip,.s2c-popover{border-color:CanvasText;}
}
`;

let injected = false;

export function injectStyles(doc: Document = document): void {
  if (injected && doc === document) return;
  if (doc.getElementById('s2c-styles')) {
    injected = true;
    return;
  }
  const style = doc.createElement('style');
  style.id = 's2c-styles';
  style.textContent = CSS;
  doc.head.append(style);
  injected = true;
}
