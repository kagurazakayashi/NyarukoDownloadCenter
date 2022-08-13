import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { store, key } from "./store";
import i18n from "./assets/i18n";
import "./assets/css/font.css";
import "@/assets/css/el-p-dark.css";
import { ElNotification } from "element-plus";
// import ElementPlus from "element-plus";
import Element from "./plugins/element";

const app = createApp(App);

// app.use(ElementPlus);
app.use(Element);
app.use(i18n);
app.use(router);
app.use(store, key);
app.config.globalProperties.$api = require("./services/api");
app.config.errorHandler = function (err: unknown) {
  console.log(" ===== err ===== ");
  console.log(err);
  ElNotification({
    title: i18n.global.t("state.error"),
    message: err as string,
    type: "error",
  });
};

app.mount("#app");
