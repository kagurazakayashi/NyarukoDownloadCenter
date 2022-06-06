import i18n from "../assets/i18n";

export default {
  data() {
    return {
      maxDownLoadCount: 2,
      //表单验证
      rules: {
        name: [
          {
            required: true,
            message: i18n.global.t("form.rules.name"),
            trigger: "blur",
          },
          {
            min: 3,
            max: 20,
            message: i18n.global.t("form.rules.len"),
            trigger: "blur",
          },
        ],
        pw: [
          {
            required: true,
            message: i18n.global.t("form.rules.pw"),
            trigger: "blur",
          },
          {
            min: 3,
            max: 20,
            message: i18n.global.t("form.rules.len"),
            trigger: "blur",
          },
        ],
      },
      loginFrom: {
        name: "",
        pw: "",
      },
      formLabelWidth: 100,
      //初始值设置
      colors: [
        { color: "#f56c6c", percentage: 30 },
        { color: "#FF7F50", percentage: 60 },
        { color: "#E6A23C", percentage: 80 },
        { color: "#81CC5C", percentage: 100 },
      ],
    };
  },
  methods: {
    setloc(routeloc: string) {
      let loc: string = routeloc;
      if (loc == "zh" || loc == "zh-CN" || loc == "zh_cn" || loc == "zh_CN") {
        loc = "zh-cn";
      }
      if (loc != "en" && loc != "zh-cn") {
        loc = "zh-cn";
      }
      sessionStorage.setItem("lang", loc);
      i18n.global.locale = loc;
    },
    showTopMenu() {
      const vContainer: HTMLDivElement | null = document.getElementById(
        "view-container"
      ) as HTMLDivElement | null;
      const fixedMenu: HTMLDivElement = document.getElementById(
        "fixed-menu-bar"
      ) as HTMLDivElement;
      if (vContainer != null) {
        vContainer.addEventListener("scroll", scrollHandler);
      }
      function scrollHandler() {
        if (vContainer != null && vContainer.scrollTop < 200) {
          fixedMenu.style.opacity = "0";
          fixedMenu.style.display = "none";
        } else if (vContainer != null && vContainer.scrollTop < 500) {
          fixedMenu.style.display = "block";
          fixedMenu.style.opacity = (
            (vContainer.scrollTop - 200) /
            300
          ).toString();
        } else {
          fixedMenu.style.display = "block";
          fixedMenu.style.opacity = "1";
        }
      }
    },
    displayMenu() {
      const vContainer: HTMLDivElement | null = document.getElementById(
        "view-container"
      ) as HTMLDivElement | null;
      const fixedMenu: HTMLDivElement = document.getElementById(
        "fixed-menu-bar"
      ) as HTMLDivElement;
      if (vContainer != null) {
        vContainer.removeEventListener("scroll", scrollremoveHandler);
      }
      function scrollremoveHandler() {
        fixedMenu.style.opacity = "0";
        fixedMenu.style.display = "none";
      }
    },

    cancelDL(store: any, fhash: string) {
      for (let i = 0; i < store.state.progressList.length; i++) {
        const e = store.state.progressList[i];
        if (this.isundefined(e)) {
          continue;
        }
        if (
          Object.prototype.hasOwnProperty.call(e, "hash") &&
          e.hash == fhash
        ) {
          e.canT.cancel("cancel");
          break;
        }
      }
    },

    isundefined(str: any): boolean {
      if (str == null || str == undefined || str == "undefined") {
        return true;
      }
      return false;
    },
    listIsHave(list: any[], lkey: string, item: any, ikey: string): boolean {
      let ish = false;
      list.forEach((e) => {
        if (e[lkey] == item[ikey]) {
          ish = true;
        }
      });
      return ish;
    },
  },
};
