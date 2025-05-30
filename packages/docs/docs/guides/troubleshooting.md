# Troubleshooting

## Parcel


### @parcel/core: Failed to load ... from ...

`react-spectrum-charts` uses `exports` in it's `package.json`. In order to take advantage of libraries that use `exports` in `Parcel`, you need to enable this in you app's `package.json` ([v2.9.0 announcement](https://parceljs.org/blog/v2-9-0/#new-resolver)).

To resolve this issue, add the following to your app's `package.json`:

```
    "@parcel/resolver-default": {
        "packageExports": true
    },
```

### Reference Error: $... is not defined

`react-spectrum-charts` uses `vega-embed` which has a dependency on `fast-json-patch`. `fast-json-patch` has a known issue where it does not get hoisted correctly by `parcel`. There is an [issue](https://github.com/adobe/react-spectrum-charts/issues/346) logged to remove our dependency on `vega-embed`. In the mean time, an alias can be used to point to the `index.js` file instead of the `index.mjs` file in `fast-json-patch`.

To resolve this issue, add the following to your app's `package.json`:

```
    "alias": {
        "fast-json-patch": "fast-json-patch/index.js"
    }
```

Workaround credit [@kylekarpack](https://github.com/kylekarpack).