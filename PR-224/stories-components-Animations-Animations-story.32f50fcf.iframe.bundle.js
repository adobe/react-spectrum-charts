"use strict";(self.webpackChunk_adobe_react_spectrum_charts=self.webpackChunk_adobe_react_spectrum_charts||[]).push([[2451],{"./src/stories/components/Bar/data.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Av:()=>generateMockDataForTrellis,C7:()=>barData,J9:()=>barSeriesData,JQ:()=>barSubSeriesData,RD:()=>barDataLongLabels,qP:()=>negativeBarSeriesData});const barData=[{browser:"Chrome",downloads:27e3,percentLabel:"53.1%"},{browser:"Firefox",downloads:8e3,percentLabel:"15.7%"},{browser:"Safari",downloads:7750,percentLabel:"15.2%"},{browser:"Edge",downloads:7600,percentLabel:"14.9%"},{browser:"Explorer",downloads:500,percentLabel:"1.0%"}],barDataLongLabels=[{browser:"Google Chrome",downloads:27e3},{browser:"Mozilla Firefox",downloads:8e3},{browser:"Mac Safari",downloads:7750},{browser:"Microsoft Edge",downloads:7600},{browser:"Microsoft Explorer",downloads:500}],barSeriesData=[{browser:"Chrome",value:5,operatingSystem:"Windows",order:2,percentLabel:"50%"},{browser:"Chrome",value:3,operatingSystem:"Mac",order:1,percentLabel:"30%"},{browser:"Chrome",value:2,operatingSystem:"Other",order:0,percentLabel:"20%"},{browser:"Firefox",value:3,operatingSystem:"Windows",order:2,percentLabel:"42.6%"},{browser:"Firefox",value:3,operatingSystem:"Mac",order:1,percentLabel:"42.6%"},{browser:"Firefox",value:1,operatingSystem:"Other",order:0,percentLabel:"14.3%"},{browser:"Safari",value:3,operatingSystem:"Windows",order:2,percentLabel:"75%"},{browser:"Safari",value:0,operatingSystem:"Mac",order:1},{browser:"Safari",value:1,operatingSystem:"Other",order:0,percentLabel:"25%"}],negativeBarSeriesData=[{browser:"Chrome",value:-5,operatingSystem:"Windows",order:2,percentLabel:"50%"},{browser:"Chrome",value:-3,operatingSystem:"Mac",order:1,percentLabel:"30%"},{browser:"Chrome",value:-2,operatingSystem:"Other",order:0,percentLabel:"20%"},{browser:"Firefox",value:-3,operatingSystem:"Windows",order:2,percentLabel:"42.6%"},{browser:"Firefox",value:-3,operatingSystem:"Mac",order:1,percentLabel:"42.6%"},{browser:"Firefox",value:-1,operatingSystem:"Other",order:0,percentLabel:"14.3%"},{browser:"Safari",value:-3,operatingSystem:"Windows",order:2,percentLabel:"75%"},{browser:"Safari",value:0,operatingSystem:"Mac",order:1},{browser:"Safari",value:-1,operatingSystem:"Other",order:0,percentLabel:"25%"}],barSubSeriesData=[{browser:"Chrome",value:5,operatingSystem:"Windows",version:"Current",order:2,percentLabel:"71.4%"},{browser:"Chrome",value:3,operatingSystem:"Mac",version:"Current",order:1,percentLabel:"42.9%"},{browser:"Chrome",value:2,operatingSystem:"Linux",version:"Current",order:0,percentLabel:"28.6%"},{browser:"Firefox",value:3,operatingSystem:"Windows",version:"Current",order:2,percentLabel:"30%"},{browser:"Firefox",value:3,operatingSystem:"Mac",version:"Current",order:1,percentLabel:"75%"},{browser:"Firefox",value:1,operatingSystem:"Linux",version:"Current",order:0,percentLabel:"25%"},{browser:"Safari",value:3,operatingSystem:"Windows",version:"Current",order:2,percentLabel:"27.3%"},{browser:"Safari",value:1,operatingSystem:"Mac",version:"Current",order:1,percentLabel:"50%"},{browser:"Safari",value:1,operatingSystem:"Linux",version:"Current",order:0,percentLabel:"25%"},{browser:"Chrome",value:2,operatingSystem:"Windows",version:"Previous",order:2,percentLabel:"28.6%"},{browser:"Chrome",value:4,operatingSystem:"Mac",version:"Previous",order:1,percentLabel:"57.1%"},{browser:"Chrome",value:5,operatingSystem:"Linux",version:"Previous",order:0,percentLabel:"71.4%"},{browser:"Firefox",value:7,operatingSystem:"Windows",version:"Previous",order:2,percentLabel:"70%"},{browser:"Firefox",value:1,operatingSystem:"Mac",version:"Previous",order:1,percentLabel:"25%"},{browser:"Firefox",value:3,operatingSystem:"Linux",version:"Previous",order:0,percentLabel:"75%"},{browser:"Safari",value:8,operatingSystem:"Windows",version:"Previous",order:2,percentLabel:"72.7%"},{browser:"Safari",value:1,operatingSystem:"Mac",version:"Previous",order:1,percentLabel:"50%"},{browser:"Safari",value:3,operatingSystem:"Linux",version:"Previous",order:0,percentLabel:"75%"}],generateMockDataForTrellis=({property1,property2,property3,propertyNames,orderBy,maxValue=1e4,randomizeSteps=!0})=>{const[property1Name,property2Name,property3Name]=propertyNames,data=[];let order=-1;for(let p1i=0;p1i<property1.length;p1i++){const p1=property1[p1i];orderBy===property1Name&&(order=p1i);for(let p2i=0;p2i<property2.length;p2i++){const p2=property2[p2i];orderBy===property2Name&&(order=p2i);for(let p3i=0;p3i<property3.length;p3i++){const p3=property3[p3i];let value;orderBy===property3Name&&(order=p3i),value=randomizeSteps?Math.max(0,Math.floor(Math.random()*maxValue)):Math.max(0,maxValue-(p1i+p2i+p3i)*(maxValue/10)),data.push({order,value,[property1Name]:p1,[property2Name]:p2,[property3Name]:p3})}}}return data}},"./src/test-utils/bindWithProps.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function bindWithProps(template){return template.bind({})}__webpack_require__.d(__webpack_exports__,{O:()=>bindWithProps})},"./src/test-utils/index.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{OK:()=>bindWithProps.O});var react_esm=__webpack_require__("./node_modules/@testing-library/react/dist/@testing-library/react.esm.js");const[queryMarksByGroupName,getAllMarksByGroupName,getMarksByGroupName,findAllMarksByGroupName,findMarksByGroupName]=(0,react_esm.H5)(((container,markName,tagName="path")=>[...container.querySelectorAll(`g.${markName} > ${tagName}`)]),((_c,markName)=>`Found multiple marks under the group name ${markName}`),((_c,markName)=>`Unable to find any marks under the group name ${markName}`)),[queryLegendEntries,getAllLegendEntries,getLegendEntries,findAllLegendEntries,findLegendEntries]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-legend-entry g.role-scope > g > path.foreground")]),(()=>"Found multiple legend entries"),(()=>"Unable to find any legend entries")),[queryLegendSymbols,getAllLegendSymbols,getLegendSymbols,findAllLegendSymbols,findLegendSymbols]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-legend-entry g.role-legend-symbol > path")]),(()=>"Found multiple legend symbols"),(()=>"Unable to find any legend symbols")),[queryAxisLabels,getAllAxisLabels,getAxisLabels,findAllAxisLabels,findAxisLabels]=(0,react_esm.H5)((container=>[...container.querySelectorAll("g.role-axis-label > text")]),(()=>"Found multiple legend entries"),(()=>"Unable to find any legend entries"));__webpack_require__("./node_modules/@testing-library/user-event/dist/esm/index.js");__webpack_require__("./src/constants.ts"),__webpack_require__("./node_modules/react/jsx-runtime.js");var bindWithProps=__webpack_require__("./src/test-utils/bindWithProps.tsx")},"./src/stories/components/Animations/Animations.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{AreaSwitch:()=>AreaSwitch,AreaZero:()=>AreaZero,BarSwitch:()=>BarSwitch,BarZero:()=>BarZero,DodgedBarSwitch:()=>DodgedBarSwitch,DodgedBarZero:()=>DodgedBarZero,SingleLineSwitch:()=>SingleLineSwitch,SingleLineZero:()=>SingleLineZero,StackedAreaSwitch:()=>StackedAreaSwitch,TrellisHorizontalBarSwitch:()=>TrellisHorizontalBarSwitch,TrellisHorizontalBarZero:()=>TrellisHorizontalBarZero,TrendlineSwitch:()=>TrendlineSwitch,TrendlineZero:()=>TrendlineZero,default:()=>__WEBPACK_DEFAULT_EXPORT__});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),_constants__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./src/constants.ts"),_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/hooks/useChartProps.tsx"),_rsc__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./src/index.ts"),_stories_data_data__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./src/stories/data/data.ts"),_test_utils__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./src/test-utils/index.ts"),_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_8__=__webpack_require__("./node_modules/@react-spectrum/button/dist/import.mjs"),_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_9__=__webpack_require__("./node_modules/@react-spectrum/view/dist/import.mjs"),_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_10__=__webpack_require__("./node_modules/@react-spectrum/text/dist/import.mjs"),_Bar_data__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./src/stories/components/Bar/data.ts"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__=__webpack_require__("./node_modules/react/jsx-runtime.js");const __WEBPACK_DEFAULT_EXPORT__={title:"RSC/Animations"},defaultChartProps={data:[],minWidth:400,maxWidth:800,height:400,animations:!0},ChartWithToggleableData=({ChartComponent,initialData,secondaryData})=>{const[dataSource,setDataSource]=(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(!0),{data,animations,...remaingProps}=ChartComponent.props,currentData=dataSource?initialData:secondaryData;return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div",{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{data:currentData,animations:!0,...remaingProps}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_8__.$n,{onPress:()=>{setDataSource(!dataSource)},variant:"primary",children:"Toggle Data"})]})},dialog=item=>(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_9__.UC,{children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_9__.Ss,{children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_adobe_react_spectrum__WEBPACK_IMPORTED_MODULE_10__.EY,{children:item[_constants__WEBPACK_IMPORTED_MODULE_1__.i4]})})}),manipulateData=data=>{const randomFactor=.5*Math.random()+.75;return Number((data*randomFactor).toFixed(1))},AreaStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)(defaultChartProps);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.Gk,{metric:"maxTemperature",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:dialog})]})}),...args})},SingleLineStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)(defaultChartProps);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.N1,{metric:"y",dimension:"x",scaleType:"linear",staticPoint:"point",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:dialog})]})}),...args})},BarStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)(defaultChartProps);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"bottom",baseline:!0,title:"Browser"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"left",grid:!0,title:"Downloads"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.yP,{dimension:"browser",metric:"downloads",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:dialog})]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.s$,{highlight:!0})]}),...args})},DodgedBarStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)({...defaultChartProps,colors:[["#00a6a0","#4bcec7"],["#575de8","#8489fd"],["#d16100","#fa8b1a"]]});return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,debug:!0,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"bottom",baseline:!0,title:"Browser"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"left",grid:!0,title:"Downloads"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.yP,{type:"dodged",dimension:"browser",color:["operatingSystem","version"],paddingRatio:.1,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.YH,{textKey:"percentLabel"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:dialog})]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.s$,{title:"Operating system",highlight:!0})]}),...args})},TrellisHorizontalBarStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)({...defaultChartProps,colors:["sequential-magma-200","sequential-magma-400","sequential-magma-600","sequential-magma-800","sequential-magma-1000","sequential-magma-1200","sequential-magma-1400"]});return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"bottom",title:"Users, Count",grid:!0}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"left",title:"Platform",baseline:!0}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.yP,{type:"stacked",trellis:"event",dimension:"segment",color:"bucket",order:"order",orientation:"horizontal",trellisOrientation:"horizontal",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:dialog})]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.s$,{highlight:!0})]}),...args})},TrendlineStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)({data:[],minWidth:400,maxWidth:800,height:400});return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"left",grid:!0,title:"Users"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__._0,{position:"bottom",labelFormat:"time",baseline:!0,ticks:!0}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.N1,{color:"series",children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_3__.cY,{...args,method:"linear",lineType:"dashed",lineWidth:"S",highlightRawPoint:!0,dimensionExtent:["domain","domain"],children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.II,{children:dialog}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.kZ,{children:item=>(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div",{children:["Trendline value: ",item[_constants__WEBPACK_IMPORTED_MODULE_1__.AZ]]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div",{children:["Line value: ",item.value]})]})})]})}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.s$,{lineWidth:{value:0},highlight:!0})]}),...args})},AreaSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(AreaStory);AreaSwitch.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.kF,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.kF.map((data=>({...data,minTemperature:manipulateData(data.minTemperature),maxTemperature:manipulateData(data.maxTemperature)})))};const AreaZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(AreaStory);AreaZero.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.kF,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.kF.concat({datetime:16685092e5,minTemperature:5,maxTemperature:32,series:"Add Fallout"})};const StackedAreaSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)((args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)({data:[],minWidth:400,maxWidth:800,height:400});return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ChartWithToggleableData,{ChartComponent:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.Gk,{dimension:"browser",color:"operatingSystem",scaleType:"point"})}),...args})}));StackedAreaSwitch.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.nk,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.nk.map((data=>({...data,value:manipulateData(data.value)})))};const SingleLineSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(SingleLineStory);SingleLineSwitch.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.Kc,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.Kc.map((data=>({...data,y:manipulateData(data.y)})))};const SingleLineZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(SingleLineStory);SingleLineZero.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.Kc,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.Kc.concat({x:16,y:55,point:!0})};const TrendlineSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(TrendlineStory);TrendlineSwitch.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.U_,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.U_.map((data=>({...data,value:manipulateData(data.value),users:manipulateData(data.users)})))};const TrendlineZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(TrendlineStory);TrendlineZero.args={initialData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.U_,secondaryData:_stories_data_data__WEBPACK_IMPORTED_MODULE_4__.U_.concat({datetime:16684102e5,point:27,value:648,users:438,series:"Add Fallout"},{datetime:16684102e5,point:27,value:10932,users:4913,series:"Add Freeform table"},{datetime:16684102e5,point:27,value:1932,users:1413,series:"Add Line viz"},{datetime:16684102e5,point:27,value:6932,users:3493,series:"Add Bar viz"})};const BarSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(BarStory);BarSwitch.args={initialData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.C7,secondaryData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.C7.map((data=>({...data,downloads:manipulateData(data.downloads)})))};const BarZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(BarStory);BarZero.args={initialData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.C7,secondaryData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.C7.concat({browser:"Opera",downloads:10,percentLabel:".01%"})};const DodgedBarSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(DodgedBarStory);DodgedBarSwitch.args={initialData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.JQ,secondaryData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.JQ.map((data=>({...data,value:manipulateData(data.value)})))};const DodgedBarZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(DodgedBarStory);DodgedBarZero.args={initialData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.JQ,secondaryData:_Bar_data__WEBPACK_IMPORTED_MODULE_6__.JQ.concat([{browser:"Opera",value:5,operatingSystem:"Windows",version:"Current",order:2,percentLabel:"71.4%"},{browser:"Opera",value:3,operatingSystem:"Mac",version:"Current",order:1,percentLabel:"42.9%"},{browser:"Opera",value:2,operatingSystem:"Linux",version:"Current",order:0,percentLabel:"28.6%"},{browser:"Opera",value:2,operatingSystem:"Windows",version:"Previous",order:2,percentLabel:"28.6%"},{browser:"Opera",value:4,operatingSystem:"Mac",version:"Previous",order:1,percentLabel:"57.1%"},{browser:"Opera",value:5,operatingSystem:"Linux",version:"Previous",order:0,percentLabel:"71.4%"}])};const trellisData=(0,_Bar_data__WEBPACK_IMPORTED_MODULE_6__.Av)({property1:["All users","Roku","Chromecast","Amazon Fire","Apple TV"],property2:["A. Sign up","B. Watch a video","C. Add to MyList"],property3:["1-5 times","6-10 times","11-15 times","16-20 times","21-25 times","26+ times"],propertyNames:["segment","event","bucket"],randomizeSteps:!1,orderBy:"bucket"}),TrellisHorizontalBarSwitch=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(TrellisHorizontalBarStory);TrellisHorizontalBarSwitch.args={initialData:trellisData,secondaryData:trellisData.map((data=>({...data,value:manipulateData(data.value)})))};const TrellisHorizontalBarZero=(0,_test_utils__WEBPACK_IMPORTED_MODULE_5__.OK)(TrellisHorizontalBarStory);TrellisHorizontalBarZero.args={initialData:trellisData,secondaryData:(0,_Bar_data__WEBPACK_IMPORTED_MODULE_6__.Av)({property1:["All users","Roku","Chromecast","Amazon Fire","Apple TV","LG Smart TV"],property2:["A. Sign up","B. Watch a video","C. Add to MyList"],property3:["1-5 times","6-10 times","11-15 times","16-20 times","21-25 times","26+ times"],propertyNames:["segment","event","bucket"],randomizeSteps:!0,orderBy:"bucket"})}}}]);