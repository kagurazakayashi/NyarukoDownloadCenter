import { createI18n } from "vue-i18n";
import elementlangZhCn from "element-plus/lib/locale/lang/zh-cn";
import elementlangEn from "element-plus/lib/locale/lang/en";
import locZhCn from "./zh-CN";
import locEn from "./en";

const messages = {
  "zh-cn": {
    ...locZhCn,
    ...elementlangZhCn,
  },
  en: {
    ...locEn,
    ...elementlangEn,
  },
};

const i18n = createI18n({
  locale: sessionStorage.getItem("lang") || "zh-cn",
  messages,
});

export default i18n;
