import { GroupMark, Mark } from 'vega';
import { BulletSpecProps } from '../../types';
import { getColorValue } from '../specUtils';

export function getBulletMarkGroup(props: BulletSpecProps): GroupMark {
    return {
        "name": `${props.name}_group`,
        "description": `${props.name}`,
        "type": "group",
        "from": {
            "facet": {
                "data": "table",
                "name": "bulletGroups",
                "groupby": `${props.dimension}`
            }
        },
        "signals": [{ "name": "width", "update": "bandwidth('xGroupScale')" }],
        "encode": {
            "update": {
                "x": { "scale": "xGroupScale", "field": `${props.dimension}` },
                "height": {"value": 20},
                "width": { "signal": "bandwidth('xGroupScale')" }
            }
        },
        "scales": [
            {
                "name": "xscale",
                "type": "linear",
                "domain": [0, { "signal": "data('max_values')[0].maxOverall" }],
                "range": [0, { "signal": "width" }],
                "round": true,
                "zero": true
            }
        ],
        "marks": []
    }
}

export function getBulletRectMark(props: BulletSpecProps): Mark {

    const rectMarkRow: Mark = {
        "name": `${props.name}_bullet`,
        "type": "rect",
        "from": { "data": "bulletGroups" },
        "encode": {
            "enter": {
                "x": { "scale": "xscale", "value": 0 },
                "x2": { "scale": "xscale", "field": `${props.metric}` },
                "y": { "value": 21 },
                "height": {"value": 6},
                "fill": { "value": `${props.color}` },
                "cornerRadiusTopRight": { "value": 2 },
                "cornerRadiusBottomRight": { "value": 2 }
            }
        }
    }

    const rectMarkColumn: Mark = {
        "type": "rect",
        "name": `${props.name}_bullet`,
        "from": {"data": "table"},
        "description": `${props.name}`,
        "encode": {
            "enter": {
                "x": {"value": 0},
                "y": {
                "field": "index",
                "mult": 60,
                "offset": -44
                },
                "width": {
                "scale": "xscale",
                "field": `${props.metric}`
                },
                "height": {"value": 6},
                "fill": {"value": `${props.color}`},
                "cornerRadiusTopRight": {"value": 2},
                "cornerRadiusBottomRight": {"value": 2}
            }
        }
    }

    return props.direction === 'column' ? rectMarkColumn : rectMarkRow
}

export function getBulletLabelMark(props: BulletSpecProps): Mark {

    const barLabelColor = getColorValue('gray-600', props.colorScheme);

    const labelMarkRow: Mark = {
        "type": "text",
        "name": `${props.name}_label`,
        "from": { "data": "bulletGroups" },
        "description": "graphLabel",
        "encode": {
          "enter": {
                "x": { "value": 0 },
                "y": {"value": 5},
                "text": {"field": `${props.dimension}`},
                "align": {"value": "left"},
                "baseline": {"value": "bottom"},
                "fill": {"value": `${barLabelColor}`},
                "fontSize": {"value": 11.5}
            }
        }
    }

    const labelMarkColumn: Mark = {
        "type": "text",
        "name": `${props.name}_label`,
        "from": {"data": "table"},
        "description": `${props.name}`,
        "encode": {
            "enter": {
                "x": {"value": 0},
                "y": {
                    "field": "index",
                    "mult": 60,
                    "offset": -60
                },
                "text": {"field": `${props.dimension}`},
                "align": {"value": "left"},
                "baseline": {"value": "bottom"},
                "fontSize": {"value": 11.5},
                "fill": {"value": `${barLabelColor}`}
            }
        }
    }

    return props.direction === 'column' ? labelMarkColumn : labelMarkRow
}

export function getBulletValueLabelMark(props: BulletSpecProps): Mark {

    const solidColor = getColorValue('gray-900', props.colorScheme);

    const valueLabelMarkRow: Mark = {
        "type": "text",
        "from": { "data": "bulletGroups" },
        "name": `${props.name}_valueLabel`,
        "encode": {
            "enter": {
                "x": { "signal": "width", "offset": 0 },
                "y": { "value": 5 }, 
                "text": { "field": `${props.metric}` },
                "align": { "value": "right" }, 
                "baseline": { "value": "bottom" },
                "fontSize": { "value": 11.5 },
                "fill": { "value": `${solidColor}` }
            }
        }
    }

    const valueLabelMarkColumn: Mark = {
        "type": "text",
        "from": {"data": "table"},
        "name": `${props.name}_valueLabel`,
        "description": `${props.name}`,
        "encode": {
            "enter": {
                "x": {"signal": "width"},
                "y": {
                    "field": "index",
                    "mult": 60,
                    "offset": -60
                },
                "text": {"field": `${props.metric}`},
                "align": {"value": "right"},
                "baseline": {"value": "bottom"},
                "fontSize": {"value": 11.5},
                "fill": {"value": `${solidColor}`}
            }
        }
    }

    return props.direction === 'column' ? valueLabelMarkColumn : valueLabelMarkRow
}

export function getBulletRuleMark(props: BulletSpecProps): Mark {

    const solidColor = getColorValue('gray-900', props.colorScheme);

    const ruleMarkRow: Mark = {
        "type": "rule",
        "from": { "data": "bulletGroups" },
        "name": `${props.name}_target`,
        "encode": {
            "enter": {
                "x": { "scale": "xscale", "field": `${props.target}` },
                "y": { "value": 12 }, 
                "y2": { "value": 36 }, 
                "stroke": { "value": `${solidColor}` },
                "strokeWidth": { "value": 2 }
            }
        }
    }

    const ruleMarkColumn: Mark = {
        "type": "rule",
        "from": {"data": "table"},
        "name": `${props.name}_target`,
        "description": `${props.name}`,
        "encode": {
          "enter": {
            "x": {
                "scale": "xscale",
                "field": `${props.target}`
            },
            "y": {
                "field": "index",
                "mult": 60,
                "offset": -53
            },
            "y2": {
                "field": "index",
                "mult": 60,
                "offset": -29
            },
            "stroke": {"value": `${solidColor}`},
            "strokeWidth": {"value": 2}
          }
        }
      }

    return props.direction === 'column' ? ruleMarkColumn : ruleMarkRow
}