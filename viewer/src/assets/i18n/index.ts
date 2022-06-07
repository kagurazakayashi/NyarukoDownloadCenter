import { createI18n } from "vue-i18n";
import elementlangZhCn from "element-plus/lib/locale/lang/zh-cn";
import elementlangZhTw from "element-plus/lib/locale/lang/zh-tw";
import elementlangEn from "element-plus/lib/locale/lang/en";
import elementlangJa from "element-plus/lib/locale/lang/ja";
import locZhCn from "./zh-CN";
import locZhTw from "./zh-TW";
import locEn from "./en";
import locJa from "./ja";

const messages = {
  "zh-cn": {
    ...locZhCn,
    ...elementlangZhCn,
  },
  en: {
    ...locEn,
    ...elementlangEn,
  },
  "zh-tw": {
    ...locZhTw,
    ...elementlangZhTw,
  },
  ja: {
    ...locJa,
    ...elementlangJa,
  },
};

const i18n = createI18n({
  locale: sessionStorage.getItem("lang") || "zh-cn",
  messages,
});

export default i18n;
