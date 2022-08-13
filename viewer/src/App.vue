<template>
  <el-config-provider :locale="$i18n.locale == 'zh' ? elloczh : ellocen">
    <el-container>
      <el-header
        :class="isDark ? 'headbar headbar-dark' : 'headbar headbar-light'"
      >
        <div class="logoview row-left">
          <img class="headlogo" alt="logo" src="./assets/media/logo.png" />
        </div>
        <div class="logoviewtitle row-left">
          {{ pageTitle() }}
        </div>
        <div class="mainmenu row-rigth">
          <el-row :gutter="0" justify="end" align="middle">
            <el-switch
              v-model="isDark"
              class="mt-2"
              style="margin-left: 24px"
              inline-prompt
              active-color="#181818"
              inactive-color="#B0C4DE"
              active-icon="Moon"
              inactive-icon="Sunny"
              :before-change="beforeChange"
            />
            <template v-if="$store.state.progressList.length > 0">
              <el-popover
                v-model:visible="$store.state.downloadListVisible"
                placement="bottom"
                :width="400"
              >
                <template #reference>
                  <el-button
                    type="success"
                    @click="
                      $store.state.downloadListVisible =
                        !$store.state.downloadListVisible
                    "
                  >
                    <el-icon>
                      <Download />
                    </el-icon>
                  </el-button>
                </template>
                <template
                  v-for="p in $store.state.progressList"
                  v-bind:key="p.hash"
                >
                  <el-row :gutter="20">
                    <el-col :span="8">{{ p.name }}</el-col>
                    <el-col :span="13">
                      <el-progress
                        :text-inside="true"
                        :stroke-width="22"
                        :percentage="p.p"
                        :color="colors"
                        status="warning"
                      />
                    </el-col>
                    <el-col :span="2">
                      <el-button
                        size="small"
                        circle
                        @click="cancelDL($store, p.hash)"
                      >
                        <el-icon>
                          <CloseBold />
                        </el-icon>
                      </el-button>
                    </el-col>
                  </el-row>
                </template>
              </el-popover>
            </template>
            <el-menu
              class="flexEnd"
              :default-active="$i18n.locale"
              mode="horizontal"
              :background-color="isDark ? '#545c64' : 'skyblue'"
              :text-color="isDark ? '#E5EAF3' : '#000'"
              :active-text-color="isDark ? '#fff' : '#204472'"
              :ellipsis="false"
              @select="settinghandleSelect"
            >
              <el-sub-menu class="menubutton row-rigth" index="user">
                <template #title>
                  {{ menuUserName == "" ? $t("button.login") : menuUserName }}
                </template>
                <el-menu-item index="login">
                  {{ $t("button.login") }}
                </el-menu-item>
                <el-menu-item index="public">
                  {{ $t("goto.title") }}
                </el-menu-item>
                <el-menu-item index="logout">
                  {{ $t("button.logout") }}
                </el-menu-item>
              </el-sub-menu>
              <el-sub-menu class="menubutton row-rigth" index="lang">
                <template #title>
                  {{ $t("loc") }}
                </template>
                <el-menu-item index="zh-cn"> 简体中文 </el-menu-item>
                <el-menu-item index="zh-tw"> 繁體中文 </el-menu-item>
                <el-menu-item index="en"> English </el-menu-item>
                <el-menu-item index="ja"> 日本語 </el-menu-item>
              </el-sub-menu>
              <!-- <el-menu-item index="login"> Login </el-menu-item> -->
              <!-- <el-menu-item
              v-if="$router.currentRoute.value.name != 'login'"
              class="menubutton row-rigth"
              index="logout"
            >
              {{ $t("button.logout") }}
            </el-menu-item> -->
            </el-menu>
          </el-row>
        </div>
      </el-header>
      <el-container>
        <!-- <el-aside width="200px">Aside</el-aside> -->
        <!-- <el-container> -->
        <el-main>
          <router-view></router-view>
          <el-dialog
            v-model="$store.state.loginDialogVisible"
            :title="$t('button.login')"
          >
            <el-form ref="ruleFormRef" :model="loginFrom" :rules="rules">
              <el-form-item
                :label="$t('form.name')"
                :label-width="formLabelWidth"
                prop="name"
              >
                <el-input v-model="loginFrom.name" autocomplete="on" />
              </el-form-item>
              <el-form-item
                :label="$t('form.pw')"
                :label-width="formLabelWidth"
                prop="pw"
              >
                <el-input
                  v-model="loginFrom.pw"
                  show-password
                  autocomplete="on"
                />
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="loginPubilc()">{{
                  $t("goto.title")
                }}</el-button>
                <el-button @click="$store.state.loginDialogVisible = false">{{
                  $t("button.cancel")
                }}</el-button>
                <el-button type="primary" @click="loginSub()">{{
                  $t("button.login")
                }}</el-button>
              </span>
            </template>
          </el-dialog>
        </el-main>
        <!-- <el-footer style="backcolor: yellow">
            <el-button @click="show()">show</el-button>
            <template
              v-for="p in $store.state.progressList"
              v-bind:key="p.hash"
            >
              <div>{{ p.name }}-{{ p.p }}</div>
            </template>
          </el-footer> -->
        <!-- </el-container> -->
      </el-container>
    </el-container>
  </el-config-provider>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import elzh from "element-plus/lib/locale/lang/zh-cn";
import elen from "element-plus/lib/locale/lang/en";
import urlAPI from "@/services/api";
import utils from "@/services/utils";
import { ElMessage } from "element-plus";
import { useStore } from "vuex";
import { key } from "./store";

export default defineComponent({
  data() {
    return {
      pageTitle: (): string => {
        return this.$t("title");
      },
      mainhandleSelect: (key: string) => {
        const strkeys = key.split("/");
        if (strkeys.length > 1) {
          this.$router.push({ path: key });
          this.displayMenu();
        } else {
          ElMessage("[message]" + key);
        }
      },
      loginPubilc: () => {
        this.$router.push({ name: "goto" });
        this.$store.state.loginDialogVisible = false;
      },
      settinghandleSelect: (key: string) => {
        if (key == "logout") {
          // eslint-disable-next-line
          this.logout().then((resp: any) => {
            if (resp.code == 10000) {
              this.$router.push({ name: "login" });
            }
          });
        } else if (key == "login") {
          this.loginFrom.name = "";
          this.loginFrom.pw = "";
          this.$store.state.loginDialogVisible = true;
        } else if (key == "public") {
          this.$router.push({ name: "goto" });
        } else {
          this.$i18n.locale = key;
          sessionStorage.setItem("lang", key);
          this.$router
            .push({ name: this.$route.name as string, params: { loc: key } })
            .then(() => {
              this.$router.go(0);
            });
          // window.location.reload();
        }
      },
      logoW: "",
      menuUserName: "",
      isDark: false,
    };
  },

  components: {},

  mixins: [utils, urlAPI],

  setup() {
    const store = useStore(key);
    const elloczh = ref(elzh);
    const ellocen = ref(elen);
    return { elloczh, ellocen, store };
  },

  mounted() {
    document.title = this.$t("title");
    this.$store.state.loginDialogVisible = false;
    if (
      this.$route.params.loc == undefined ||
      this.$route.params.loc == "undefined" ||
      this.$route.params.loc == null
    ) {
      const loc = sessionStorage.getItem("lang");
      if (loc != null) {
        this.setloc(loc);
      }
    } else {
      this.setloc(this.$route.params.loc as string);
    }
    const isd = sessionStorage.getItem("isDark");
    if (isd == "1") {
      this.isDark = true;
    }
    this.setDark(this.isDark);
    const user = sessionStorage.getItem("user");
    if (user && user.length > 0) {
      this.menuUserName = user;
    }
  },

  beforeChange() {
    // this.isDark = !this.isDark;
    const isD = !this.isDark;
    if (isD) {
      sessionStorage.setItem("isDark", "1");
    } else {
      sessionStorage.setItem("isDark", "0");
    }
    this.setDark(isD);
    return new Promise(function (_resolve) {
      _resolve(true);
    });
  },

  methods: {
    show() {
      console.log(JSON.stringify(this.$store.state.progressList));
    },

    loginSub() {
      let form = this.$refs.ruleFormRef as HTMLFormElement;
      // eslint-disable-next-line
      form.validate((valid: boolean, fields: any) => {
        if (valid) {
          console.log("submit!", JSON.stringify(this.loginFrom));
          // eslint-disable-next-line
          this.login(this.loginFrom.name, this.loginFrom.pw).then((s: any) => {
            if (s.code == 10000) {
              this.menuUserName = this.loginFrom.name;
              console.log("this.menuUserName", this.menuUserName);
              this.$store.state.loginDialogVisible = false;
              const urls = this.$route.fullPath.split("/");
              if (urls.length > 2) {
                this.$router.go(0);
              } else {
                this.$router.push({ path: "/zh-cn/f/-" });
              }
            }
          });
        } else {
          console.log("error submit!", JSON.stringify(fields));
        }
      });
    },
  },
});
</script>
<style>
html,
body {
  height: 100%;
  min-width: 345px;
  margin: 0;
}

#app {
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.headbar {
  min-width: 345px;
  background-color: skyblue;
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 5px 8px 0 rgba(0, 0, 0, 0.14),
    0 1px 14px 0 rgba(0, 0, 0, 0.12);
}

.row-left {
  float: left !important;
}

.row-rigth {
  float: right !important;
}

.el-collapse-item__wrap,
.el-collapse-item__content {
  height: 100%;
}

.el-header {
  --el-header-height: 50px !important;
  --el-header-padding: 0px 0px !important;
}

.menubutton {
  height: 50px !important;
  line-height: 50px !important;
}

.el-menu a {
  text-decoration: none;
}

.el-menu {
  border-bottom: none !important;
  height: 50px;
}

.el-submenu__title {
  height: 50px !important;
  line-height: 50px !important;
}

.el-submenu__title:hover {
  color: skyblue !important;
  background-color: skyblue !important;
}

.logoview {
  padding-left: 20px;
  height: 50px;
  text-align: left;
}

.logoviewtitle {
  padding-left: 20px;
  height: 50px;
  line-height: 50px;
  text-align: left;
  font-size: large;
}

.headlogo {
  height: 40px;
  margin: 5px;
}

.mainmenu {
  min-width: 300px;
}

.mainmenu .el-menu-item,
.mainmenu .el-sub-menu {
  border-bottom: none !important;
}

.rightMenuWidth {
  width: 50%;
}

.flexEnd {
  justify-content: flex-end;
}

.mainView {
  height: 100%;
  background: orange;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: center;
}

.headbar-light {
  background-color: skyblue;
  color: #204472;
}

.headbar-dark {
  background-color: #545c64;
}

@media screen and (max-width: 900px) {
  .el-dialog {
    width: 50% !important;
  }
}

@media screen and (max-width: 550px) {
  .el-dialog {
    width: 80% !important;
  }
  .mainmenu {
    min-width: 100px;
  }
}

@media screen and (max-width: 435px) {
  .logoviewtitle {
    display: none;
  }

  .logoview {
    width: 85px;
  }

  .el-dialog {
    width: 90% !important;
  }

  .el-popover {
    min-width: 300px !important;
    width: 85% !important;
  }
}
</style>
<style scoped>
.el-container {
  height: 100%;
}

/* .el-main {
  height: calc(100% - 100px);
} */

#mainView {
  height: 100%;
}
</style>
