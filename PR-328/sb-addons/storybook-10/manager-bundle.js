try{
(()=>{var a=/\/react-spectrum-charts\/PR-(\w+)\/$/,e=window.location.pathname.match(a);if(e&&e[1]){let t=document.createElement("div");t.style.width="100%",t.style.backgroundColor="#066ce7",t.style.textAlign="center",t.style.padding="8px",t.style.color="white",t.innerHTML=`This is the Storybook built for <b><a href="https://github.com/adobe/react-spectrum-charts/pull/${e[1]}" style="color: white;" target="blank">PR-${e[1]}</a></b>, to visit the production version, <a href="https://opensource.adobe.com/react-spectrum-charts/" style="color: white;" target="blank">click here</a>.`,document.body.insertBefore(t,document.body.firstChild)}})();
}catch(e){ console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e); }