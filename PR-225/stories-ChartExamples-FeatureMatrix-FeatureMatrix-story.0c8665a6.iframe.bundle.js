"use strict";(self.webpackChunk_adobe_react_spectrum_charts=self.webpackChunk_adobe_react_spectrum_charts||[]).push([[5332],{"./src/test-utils/bindWithProps.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function bindWithProps(template){return template.bind({})}__webpack_require__.d(__webpack_exports__,{O:()=>bindWithProps})},"./src/test-utils/index.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{OK:()=>bindWithProps.O,Dx:()=>manipulateData});var react_esm=__webpack_require__("./node_modules/@testing-library/react/dist/@testing-library/react.esm.js");const[queryMarksByGroupName,getAllMarksByGroupName,getMarksByGroupName,findAllMarksByGroupName,findMarksByGroupName]=(0,react_esm.H5)(((container,markName,tagName="path")=>[...container.querySelectorAll(`g.${markName} > ${tagName}`)]),((_c,markName)=>`Found multiple marks under the group name ${markName}`),((_c,markName)=>`Unable to find any marks under the group name ${markName}`)),[queryLegendEntries,getAllLegendEntries,getLegendEntries,findAllLegendEntries,findLegendEntries]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-legend-entry g.role-scope > g > path.foreground")]),(()=>"Found multiple legend entries"),(()=>"Unable to find any legend entries")),[queryLegendSymbols,getAllLegendSymbols,getLegendSymbols,findAllLegendSymbols,findLegendSymbols]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-legend-entry g.role-legend-symbol > path")]),(()=>"Found multiple legend symbols"),(()=>"Unable to find any legend symbols")),[queryAxisLabels,getAllAxisLabels,getAxisLabels,findAllAxisLabels,findAxisLabels]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-axis-label > text")]),(()=>"Found multiple legend entries"),(()=>"Unable to find any legend entries"));__webpack_require__("./node_modules/@testing-library/user-event/dist/esm/index.js");const manipulateData=data=>{const result=data*(Math.random()*(1.15-.85)+.85);return Math.round(result)};__webpack_require__("./src/constants.ts"),__webpack_require__("./node_modules/react/jsx-runtime.js");var bindWithProps=__webpack_require__("./src/test-utils/bindWithProps.tsx")},"./src/stories/ChartExamples/FeatureMatrix/FeatureMatrix.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{FeatureMatrix:()=>FeatureMatrix,MultipleSegmentFeatureMatrix:()=>MultipleSegmentFeatureMatrix,TimeCompareFeatureMatrix:()=>TimeCompareFeatureMatrix,default:()=>FeatureMatrix_story});var useChartProps=__webpack_require__("./src/hooks/useChartProps.tsx"),src=__webpack_require__("./src/index.ts"),test_utils=__webpack_require__("./src/test-utils/index.ts");const basicFeatureMatrixData=[{event:"Open-editor",segment:"Day  1 Exporter",dauPercent:.1534,countAvg:1.92},{event:"View-express-home",segment:"Day  1 Exporter",dauPercent:.1327,countAvg:1.66},{event:"View-quickaction-editor",segment:"Day  1 Exporter",dauPercent:.0183,countAvg:3.95},{event:"Generate-image",segment:"Day  1 Exporter",dauPercent:.0915,countAvg:1.84},{event:"Generate-text-effects",segment:"Day  1 Exporter",dauPercent:.0277,countAvg:4.25},{event:"Search-inspire",segment:"Day  1 Exporter",dauPercent:.0763,countAvg:6.28}],multipleSegmentFeatureMatrixData=[...basicFeatureMatrixData,{event:"Open-editor",segment:"Non Day  1 Exporter",dauPercent:.1344,countAvg:3.75},{event:"View-express-home",segment:"Non Day  1 Exporter",dauPercent:.1336,countAvg:.84},{event:"View-quickaction-editor",segment:"Non Day  1 Exporter",dauPercent:.0967,countAvg:1.27},{event:"Generate-image",segment:"Non Day  1 Exporter",dauPercent:.0658,countAvg:2.36},{event:"Generate-text-effects",segment:"Non Day  1 Exporter",dauPercent:.0272,countAvg:2.71},{event:"Search-inspire",segment:"Non Day  1 Exporter",dauPercent:.1149,countAvg:5.8},{event:"Open-editor",segment:"Day 7 Exporter",dauPercent:.1365,countAvg:4.68},{event:"View-express-home",segment:"Day 7 Exporter",dauPercent:.1064,countAvg:5.22},{event:"View-quickaction-editor",segment:"Day 7 Exporter",dauPercent:.0795,countAvg:1.51},{event:"Generate-image",segment:"Day 7 Exporter",dauPercent:.0578,countAvg:2.2},{event:"Generate-text-effects",segment:"Day 7 Exporter",dauPercent:.0183,countAvg:1.75},{event:"Search-inspire",segment:"Day 7 Exporter",dauPercent:.0998,countAvg:2.98}],timeCompareFeatureMatrixData=[{event:"Open-editor",segment:"Day  1 Exporter",dauPercent:.1834,countAvg:1.62,period:"past",pathWidth:0},{event:"View-express-home",segment:"Day  1 Exporter",dauPercent:.2327,countAvg:2.66,period:"past",pathWidth:0},{event:"View-quickaction-editor",segment:"Day  1 Exporter",dauPercent:.0083,countAvg:2.95,period:"past",pathWidth:0},{event:"Generate-image",segment:"Day  1 Exporter",dauPercent:.0015,countAvg:2.84,period:"past",pathWidth:0},{event:"Generate-text-effects",segment:"Day  1 Exporter",dauPercent:.1277,countAvg:2.25,period:"past",pathWidth:0},{event:"Search-inspire",segment:"Day  1 Exporter",dauPercent:.0563,countAvg:5.28,period:"past",pathWidth:0},{event:"Open-editor",segment:"Non Day  1 Exporter",dauPercent:.1144,countAvg:3.75,period:"past",pathWidth:0},{event:"View-express-home",segment:"Non Day  1 Exporter",dauPercent:.1236,countAvg:.84,period:"past",pathWidth:0},{event:"View-quickaction-editor",segment:"Non Day  1 Exporter",dauPercent:.1167,countAvg:2.27,period:"past",pathWidth:0},{event:"Generate-image",segment:"Non Day  1 Exporter",dauPercent:.0658,countAvg:2.4,period:"past",pathWidth:0},{event:"Generate-text-effects",segment:"Non Day  1 Exporter",dauPercent:.0172,countAvg:2.21,period:"past",pathWidth:0},{event:"Search-inspire",segment:"Non Day  1 Exporter",dauPercent:.1049,countAvg:5.6,period:"past",pathWidth:0},{event:"Open-editor",segment:"Day 7 Exporter",dauPercent:.1565,countAvg:6.68,period:"past",pathWidth:0},{event:"View-express-home",segment:"Day 7 Exporter",dauPercent:.0964,countAvg:4.22,period:"past",pathWidth:0},{event:"View-quickaction-editor",segment:"Day 7 Exporter",dauPercent:.0715,countAvg:1.59,period:"past",pathWidth:0},{event:"Generate-image",segment:"Day 7 Exporter",dauPercent:.0678,countAvg:2.5,period:"past",pathWidth:0},{event:"Generate-text-effects",segment:"Day 7 Exporter",dauPercent:.0583,countAvg:.75,period:"past",pathWidth:0},{event:"Search-inspire",segment:"Day 7 Exporter",dauPercent:.1098,countAvg:3.98,period:"past",pathWidth:0},...multipleSegmentFeatureMatrixData.map((d=>({...d,period:"present",pathWidth:1})))].sort(((a,b)=>a.event>b.event?1:a.event<b.event?-1:0)).sort(((a,b)=>a.segment>b.segment?1:a.segment<b.segment?-1:0));var jsx_runtime=__webpack_require__("./node_modules/react/jsx-runtime.js");const FeatureMatrix_story={title:"RSC/Chart/Examples",component:src.t1},trendlineProps={method:"median",lineWidth:"XS",lineType:"solid",dimensionExtent:["domain","domain"]},FeatureMatrix=(0,test_utils.OK)((args=>{const chartProps=(0,useChartProps.A)(args);return(0,jsx_runtime.jsxs)(src.t1,{...chartProps,children:[(0,jsx_runtime.jsx)(src._0,{position:"bottom",ticks:!0,grid:!0,title:"Percentage of daily users (DAU)",labelFormat:"percentage"}),(0,jsx_runtime.jsx)(src._0,{position:"left",ticks:!0,grid:!0,title:"Average number of times per day"}),(0,jsx_runtime.jsxs)(src.Xl,{dimension:"dauPercent",metric:"countAvg",color:"segment",children:[(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,color:"gray-900",orientation:"horizontal",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median times",numberFormat:".3"})}),(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,color:"gray-900",orientation:"vertical",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median %DAU",numberFormat:".2%"})})]}),(0,jsx_runtime.jsx)(src.s$,{position:"bottom",highlight:!0})]})}));FeatureMatrix.args={animations:!1,width:"auto",maxWidth:850,height:500,data:basicFeatureMatrixData};const MultipleSegmentFeatureMatrix=(0,test_utils.OK)((args=>{const chartProps=(0,useChartProps.A)(args);return(0,jsx_runtime.jsxs)(src.t1,{...chartProps,children:[(0,jsx_runtime.jsx)(src._0,{position:"bottom",ticks:!0,grid:!0,title:"Percentage of daily users (DAU)",labelFormat:"percentage"}),(0,jsx_runtime.jsx)(src._0,{position:"left",ticks:!0,grid:!0,title:"Average number of times per day"}),(0,jsx_runtime.jsxs)(src.Xl,{dimension:"dauPercent",metric:"countAvg",color:"segment",children:[(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,displayOnHover:!0,orientation:"horizontal",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median times",numberFormat:".3"})}),(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,displayOnHover:!0,orientation:"vertical",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median %DAU",numberFormat:".2%"})})]}),(0,jsx_runtime.jsx)(src.s$,{position:"bottom",highlight:!0})]})}));MultipleSegmentFeatureMatrix.args={animations:!1,width:"auto",maxWidth:850,height:500,data:multipleSegmentFeatureMatrixData};const TimeCompareFeatureMatrix=(0,test_utils.OK)((args=>{const chartProps=(0,useChartProps.A)(args);return(0,jsx_runtime.jsxs)(src.t1,{...chartProps,children:[(0,jsx_runtime.jsx)(src._0,{position:"bottom",ticks:!0,grid:!0,title:"Percentage of daily users (DAU)",labelFormat:"percentage"}),(0,jsx_runtime.jsx)(src._0,{position:"left",ticks:!0,grid:!0,title:"Average number of times per day"}),(0,jsx_runtime.jsxs)(src.Xl,{dimension:"dauPercent",metric:"countAvg",color:"segment",lineType:"period",opacity:"period",lineWidth:{value:1},children:[(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,displayOnHover:!0,orientation:"horizontal",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median times",numberFormat:".3"})}),(0,jsx_runtime.jsx)(src.cY,{...trendlineProps,displayOnHover:!0,orientation:"vertical",children:(0,jsx_runtime.jsx)(src.$M,{prefix:"Median %DAU",numberFormat:".2%"})}),(0,jsx_runtime.jsx)(src.Yc,{groupBy:["event","segment"],pathWidth:"pathWidth",opacity:.2})]}),(0,jsx_runtime.jsx)(src.s$,{position:"bottom",highlight:!0})]})}));TimeCompareFeatureMatrix.args={animations:!1,width:"auto",maxWidth:850,height:500,lineTypes:["dotted","solid"],opacities:[.5,1],symbolSizes:[1,"M"],data:timeCompareFeatureMatrixData}}}]);