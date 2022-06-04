// import {
//   ElConfigProvider,
//   ElContainer,
//   ElHeader,
//   ElMain,
//   ElButton,
//   ElMenu,
//   ElSubMenu,
//   ElMenuItem,
//   ElDrawer,
//   ElTableV2,
//   ElTableColumn,
// } from "element-plus";
// import ElementPlus from 'element-plus'
// import "element-plus/dist/index.css";
import "element-plus/theme-chalk/index.css";
import "element-plus/theme-chalk/display.css";
// import "element-plus/lib/theme-chalk/index.css";
// import "element-plus/lib/theme-chalk/display.css";
// import locale from "element-plus/lib/locale/lang/zh-cn";

import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const iconList = [
  "Document",
  "Folder",
  "Download",
  "Edit",
  "CloseBold",
  "CircleCloseFilled",
  "DocumentRemove",
  "Picture",
  "VideoCamera",
  "Headset",
  "Setting",
  "List",
  "DataAnalysis",
  "Box",
  "CollectionTag",
  "Expand",
  "SetUp",
  "PictureRounded",
];
// eslint-disable-next-line
export default (app: any) => {
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    iconList.forEach((e) => {
      if (key == e) {
        app.component(key, component);
      }
    });
  }
  // app.use(ElementPlus);
  // app.use(ElConfigProvider);
  // app.use(ElContainer);
  // app.use(ElHeader);
  // app.use(ElMain);
  // app.use(ElButton);
  // app.use(ElMenu);
  // app.use(ElSubMenu);
  // app.use(ElMenuItem);
  // app.use(ElDrawer);
  // app.use(ElTableV2);
  // app.use(ElTableColumn);
};
