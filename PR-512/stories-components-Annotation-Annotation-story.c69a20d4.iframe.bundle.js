"use strict";(self.webpackChunk_adobe_react_spectrum_charts=self.webpackChunk_adobe_react_spectrum_charts||[]).push([[9027],{"./src/stories/components/Annotation/Annotation.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{FixedWidthBar:()=>FixedWidthBar,HorizontalBarChart:()=>HorizontalBarChart,VerticalBarChart:()=>VerticalBarChart,default:()=>__WEBPACK_DEFAULT_EXPORT__});__webpack_require__("./node_modules/react/index.js");var _components_Annotation_Annotation__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./src/components/Annotation/Annotation.tsx"),_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/hooks/useChartProps.tsx"),_rsc__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./src/index.ts"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./node_modules/react/jsx-runtime.js");const __WEBPACK_DEFAULT_EXPORT__={title:"RSC/Bar/Annotation",component:_components_Annotation_Annotation__WEBPACK_IMPORTED_MODULE_1__.Y,argTypes:{children:{description:"`(datum) => React.ReactElement`",control:{type:null}}}},data=[{browser:"Chrome",value:5,operatingSystem:"Windows",order:2,percentLabel:"50%"},{browser:"Chrome",value:3,operatingSystem:"Mac",order:1,percentLabel:"30%"},{browser:"Chrome",value:2,operatingSystem:"Other",order:0,percentLabel:"20%"},{browser:"Firefox",value:3,operatingSystem:"Windows",order:2,percentLabel:"42.6%"},{browser:"Firefox",value:3,operatingSystem:"Mac",order:1,percentLabel:"42.6%"},{browser:"Firefox",value:1,operatingSystem:"Other",order:0,percentLabel:"14.3%"},{browser:"Safari",value:3,operatingSystem:"Windows",order:2,percentLabel:"75%"},{browser:"Safari",value:0,operatingSystem:"Mac",order:1},{browser:"Safari",value:1,operatingSystem:"Other",order:0,percentLabel:"25%"}],barArgs={dimension:"browser",order:"order",color:"operatingSystem"},BarAnnotationStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_2__.A)({data}),{barOrientation="vertical",chartHeight=300,chartWidth=300,...annotationProps}=args;return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.t1,{...chartProps,height:chartHeight,width:chartWidth,children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_3__.yP,{...barArgs,orientation:barOrientation,children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_components_Annotation_Annotation__WEBPACK_IMPORTED_MODULE_1__.Y,{...annotationProps})})})},HorizontalBarChart=BarAnnotationStory.bind({});HorizontalBarChart.args={textKey:"percentLabel",barOrientation:"horizontal"};const VerticalBarChart=BarAnnotationStory.bind({});VerticalBarChart.args={textKey:"percentLabel",barOrientation:"vertical"};const FixedWidthBar=BarAnnotationStory.bind({});FixedWidthBar.args={textKey:"percentLabel",style:{width:48}}}}]);