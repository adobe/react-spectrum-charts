"use strict";(self.webpackChunk_adobe_react_spectrum_charts=self.webpackChunk_adobe_react_spectrum_charts||[]).push([[1411],{"./src/test-utils/bindWithProps.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function bindWithProps(template){return template.bind({})}__webpack_require__.d(__webpack_exports__,{O:()=>bindWithProps});try{bindWithProps.displayName="bindWithProps",bindWithProps.__docgenInfo={description:"Will make the props in a story required (by default Storybook makes all props optional).\nUseful for testing a component with props.\n\nUsage: `const CustomStory = bindWithProps(TemplateStory);`",displayName:"bindWithProps",props:{decorators:{defaultValue:null,description:"Wrapper components or Storybook decorators that wrap a story.\n\nDecorators defined in Meta will be applied to every story variation.\n@see [Decorators](https://storybook.js.org/docs/addons/introduction/#1-decorators)",name:"decorators",required:!1,type:{name:"DecoratorFunction<ReactRenderer, Simplify<ComponentProps<T>, {}>> | DecoratorFunction<ReactRenderer, Simplify<...>>[] | DecoratorFunction<...> | DecoratorFunction<...>[]"}},parameters:{defaultValue:null,description:"Custom metadata for a story.\n@see [Parameters](https://storybook.js.org/docs/basics/writing-stories/#parameters)",name:"parameters",required:!1,type:{name:"Parameters"}},args:{defaultValue:null,description:"Dynamic data that are provided (and possibly updated by) Storybook and its addons.\n@see [Arg story inputs](https://storybook.js.org/docs/react/api/csf#args-story-inputs)",name:"args",required:!1,type:{name:"Partial<ComponentProps<T>> | Partial<T>"}},argTypes:{defaultValue:null,description:"ArgTypes encode basic metadata for args, such as `name`, `description`, `defaultValue` for an arg. These get automatically filled in by Storybook Docs.\n@see [Control annotations](https://github.com/storybookjs/storybook/blob/91e9dee33faa8eff0b342a366845de7100415367/addons/controls/README.md#control-annotations)",name:"argTypes",required:!1,type:{name:"Partial<ArgTypes<ComponentProps<T>>> | Partial<ArgTypes<T>>"}},loaders:{defaultValue:null,description:"Asynchronous functions which provide data for a story.\n@see [Loaders](https://storybook.js.org/docs/react/writing-stories/loaders)",name:"loaders",required:!1,type:{name:"LoaderFunction<ReactRenderer, ComponentProps<T>> | LoaderFunction<ReactRenderer, ComponentProps<T>>[] | LoaderFunction<...> | LoaderFunction<...>[]"}},render:{defaultValue:null,description:"Define a custom render function for the story(ies). If not passed, a default render function by the renderer will be used.",name:"render",required:!1,type:{name:"ArgsStoryFn<ReactRenderer, ComponentProps<T>> | ArgsStoryFn<ReactRenderer, T>"}},storyName:{defaultValue:null,description:"Override the display name in the UI (CSF v2)",name:"storyName",required:!1,type:{name:"string"}},play:{defaultValue:null,description:"Function that is executed after the story is rendered.",name:"play",required:!1,type:{name:"PlayFunction<ReactRenderer, ComponentProps<T>> | PlayFunction<ReactRenderer, T>"}},tags:{defaultValue:null,description:"Named tags for a story, used to filter stories in different contexts.",name:"tags",required:!1,type:{name:"string[]"}},story:{defaultValue:null,description:"@deprecated",name:"story",required:!1,type:{name:'Omit<StoryAnnotations<ReactRenderer, ComponentProps<T>, Partial<ComponentProps<T>>>, "story"> | Omit<...>'}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/test-utils/bindWithProps.tsx#bindWithProps"]={docgenInfo:bindWithProps.__docgenInfo,name:"bindWithProps",path:"src/test-utils/bindWithProps.tsx#bindWithProps"})}catch(__react_docgen_typescript_loader_error){}},"./src/stories/components/Title/Title.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Basic:()=>Basic,FontWeight:()=>FontWeight,Orient:()=>Orient,Position:()=>Position,default:()=>__WEBPACK_DEFAULT_EXPORT__});__webpack_require__("./node_modules/react/index.js");var _hooks_useChartProps__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./src/hooks/useChartProps.tsx"),_rsc__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/index.ts"),_stories_data_data__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./src/stories/data/data.ts"),test_utils_bindWithProps__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./src/test-utils/bindWithProps.tsx"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./node_modules/react/jsx-runtime.js");const __WEBPACK_DEFAULT_EXPORT__={title:"RSC/Title",component:_rsc__WEBPACK_IMPORTED_MODULE_2__.hE},defaultChartProps={data:_stories_data_data__WEBPACK_IMPORTED_MODULE_3__.pH,minWidth:400,maxWidth:800,height:400},TitleBarStory=args=>{const chartProps=(0,_hooks_useChartProps__WEBPACK_IMPORTED_MODULE_1__.A)(defaultChartProps);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_rsc__WEBPACK_IMPORTED_MODULE_2__.t1,{...chartProps,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_2__.hE,{...args}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_2__.yP,{color:"series"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_2__.s$,{}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_2__._0,{position:"bottom",baseline:!0}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_rsc__WEBPACK_IMPORTED_MODULE_2__._0,{position:"left",grid:!0})]})};TitleBarStory.displayName="TitleBarStory";const Basic=(0,test_utils_bindWithProps__WEBPACK_IMPORTED_MODULE_5__.O)(TitleBarStory);Basic.args={text:"Bar Chart"};const Orient=(0,test_utils_bindWithProps__WEBPACK_IMPORTED_MODULE_5__.O)(TitleBarStory);Orient.args={text:"Bar Chart",orient:"bottom"};const Position=(0,test_utils_bindWithProps__WEBPACK_IMPORTED_MODULE_5__.O)(TitleBarStory);Position.args={text:"Bar Chart",position:"start"};const FontWeight=(0,test_utils_bindWithProps__WEBPACK_IMPORTED_MODULE_5__.O)(TitleBarStory);FontWeight.args={text:"Bar Chart",fontWeight:"lighter"}}}]);