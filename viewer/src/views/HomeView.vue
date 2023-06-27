<template>
  <el-breadcrumb separator=">">
    <template v-for="item in bDatas" v-bind:key="item.path">
      <el-breadcrumb-item
        :to="{ path: item.path }"
        @click="jumpFolder(item.path)"
        >{{ item.name }}</el-breadcrumb-item
      >
    </template>
  </el-breadcrumb>
  <template v-if="screenWidth <= 500">
    <div style="height: 15px"></div>
    <template v-for="item in tableDatas" v-bind:key="item.hash">
      <el-card
        v-if="item.type == 'folder'"
        class="box-card"
        @click="jumpFolder(item.link)"
      >
        <div class="text item">
          <el-icon><Folder /></el-icon>
          <span class="item-name">{{ item.name }}</span>
        </div>
      </el-card>
      <el-card v-else class="box-card file-item">
        <el-row :gutter="20">
          <el-col :span="2">
            <el-icon><Document /></el-icon>
          </el-col>
          <el-col
            :span="
              listIsHave(
                $store.state.progressList,
                'hash',
                { hash: item.hash },
                'hash'
              )
                ? 14
                : 18
            "
          >
            <span>{{ item.name }}</span>
            <div class="file-size">{{ item.size }}</div>
          </el-col>
          <el-col
            :span="
              listIsHave(
                $store.state.progressList,
                'hash',
                { hash: item.hash },
                'hash'
              )
                ? 8
                : 4
            "
          >
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="
                tooltipStr($store.state.progressList.length, item.exist)
              "
              placement="left"
            >
              <el-button
                v-show="
                  !listIsHave(
                    $store.state.progressList,
                    'hash',
                    { hash: item.hash },
                    'hash'
                  )
                "
                :type="
                  $store.state.progressList.length < maxDownLoadCount &&
                  item.exist == '1'
                    ? 'primary'
                    : 'danger'
                "
                @click="
                  $store.state.progressList.length < maxDownLoadCount &&
                  item.exist == '1'
                    ? dl(item.hash, item.name)
                    : tsnull($store.state.progressList.length, item.exist)
                "
                ><el-icon
                  ><template
                    v-if="
                      $store.state.progressList.length < maxDownLoadCount &&
                      item.exist == '1'
                    "
                  >
                    <Download />
                  </template>
                  <template
                    v-if="
                      $store.state.progressList.length >= maxDownLoadCount ||
                      item.exist != '1'
                    "
                    ><CircleCloseFilled /></template></el-icon
              ></el-button>
            </el-tooltip>
            <template
              v-if="
                listIsHave(
                  $store.state.progressList,
                  'hash',
                  { hash: item.hash },
                  'hash'
                )
              "
              ><el-row :gutter="0" justify="space-evenly" align="middle">
                <el-col :span="6">
                  <el-progress
                    :stroke-width="3"
                    :width="40"
                    type="dashboard"
                    :percentage="item.progress"
                    :color="colors"
                /></el-col>
                <el-col :span="4">
                  <el-button
                    size="default"
                    circle
                    @click="cancelDL($store, item.hash)"
                    ><el-icon><CloseBold /></el-icon></el-button
                ></el-col>
              </el-row>
            </template>
          </el-col>
        </el-row>
      </el-card>
    </template>
  </template>
  <el-table
    v-else
    :data="tableDatas"
    style="width: 100%; min-width: 325px"
    @current-change="handleCurrentChange"
    table-layout="fixed"
    scrollbar-always-on
  >
    <el-table-column prop="icon" :width="40">
      <template #default="scope">
        <template v-if="scope.row.type == 'folder'">
          <el-icon><Folder /></el-icon>
        </template>
        <template v-if="scope.row.type == 'file'">
          <el-icon><Document /></el-icon>
        </template>
      </template>
    </el-table-column>
    <el-table-column prop="name" :label="$t('tableHeard.name')" />
    <!-- <el-table-column prop="describe" :label="$t('tableHeard.describe')" /> -->
    <el-table-column prop="size" :width="110" :label="$t('tableHeard.size')">
      <template #default="scope">
        <template v-if="scope.row.type == 'folder'"> </template>
        <template v-if="scope.row.type == 'file'">
          {{ scope.row.size }}
        </template>
      </template>
    </el-table-column>
    <el-table-column prop="download" :width="140" align="center">
      <template #default="scope">
        <template v-if="scope.row.type == 'file'">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="
              tooltipStr($store.state.progressList.length, scope.row.exist)
            "
            placement="left"
          >
            <el-button
              v-show="
                !listIsHave(
                  $store.state.progressList,
                  'hash',
                  { hash: scope.row.hash },
                  'hash'
                )
              "
              :type="
                $store.state.progressList.length < maxDownLoadCount &&
                scope.row.exist == '1'
                  ? 'primary'
                  : 'danger'
              "
              @click="
                $store.state.progressList.length < maxDownLoadCount &&
                scope.row.exist == '1'
                  ? dl(scope.row.hash, scope.row.name)
                  : tsnull($store.state.progressList.length, scope.row.exist)
              "
              ><el-icon
                ><template
                  v-if="
                    $store.state.progressList.length < maxDownLoadCount &&
                    scope.row.exist == '1'
                  "
                >
                  <Download />
                </template>
                <template
                  v-if="
                    $store.state.progressList.length >= maxDownLoadCount ||
                    scope.row.exist != '1'
                  "
                  ><CircleCloseFilled /></template></el-icon
            ></el-button>
          </el-tooltip>
          <template
            v-if="
              listIsHave(
                $store.state.progressList,
                'hash',
                { hash: scope.row.hash },
                'hash'
              )
            "
            ><el-row :gutter="0" justify="space-evenly" align="middle">
              <el-col :span="6">
                <el-progress
                  :stroke-width="3"
                  :width="40"
                  type="dashboard"
                  :percentage="scope.row.progress"
                  :color="colors"
              /></el-col>
              <el-col :span="4">
                <el-button
                  size="default"
                  circle
                  @click="cancelDL($store, scope.row.hash)"
                  ><el-icon><CloseBold /></el-icon></el-button
              ></el-col>
            </el-row>
          </template>
        </template>
      </template>
    </el-table-column>
  </el-table>
  <div id="dw"></div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import urlAPI from "@/services/api";
import utils from "@/services/utils";
import axios from "axios";

interface type {
  reLogin: number;
  tableDatas: tableData[];

  filedata: any;
  bDatas: breadcrumbData[];

  screenWidth: number;
}
interface breadcrumbData {
  path: string;
  name: string;
}
interface tableData {
  hash: string;
  name: string;
  describe: string;
  size: string;
  type: string;
  link: string;
  exist: string;
  progress: number | undefined;
}
export default defineComponent({
  data() {
    return {
      reLogin: 5,
      tableDatas: [],
      filedata: {},
      bDatas: [],
      screenWidth: 0,
    } as type;
  },
  mixins: [utils, urlAPI],
  components: {},
  mounted() {
    this.screenWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      this.screenWidth = window.innerWidth;
    });
    // this.t2columns = generateColumns(5);
    // this.data = generateData(this.t2columns, 200);
    // const cc = generateColumns(5);
    // // console.log(JSON.stringify(cc));
    // const dd = generateData(cc, 200);
    // // console.log(JSON.stringify(dd));
    this.init();
    // console.log(this.$route.fullPath);
  },
  methods: {
    // countAdd() {
    //   // {{ $store.state.count }}
    //
    //   this.$store.commit("addCount");
    //   this.reload;
    // },

    init() {
      const token = sessionStorage.getItem("exToken");
      const user = sessionStorage.getItem("user");
      if (
        token == undefined ||
        token == "undefined" ||
        token == null ||
        token == "" ||
        user != this.$route.params.loc
      ) {
        this.login(
          this.$route.params.u as string,
          this.$route.params.p as string
        ).then(() => {
          this.getFL();
        });
      } else {
        this.getFL();
      }
    },

    getFL() {
      if (
        Object.keys(this.filedata).length == 0 ||
        this.isundefined(this.filedata)
      ) {
        const urlloc = this.$route.params.loc as string;
        let loc: string = urlloc;
        if (this.isundefined(urlloc)) {
          const ssloc: string = sessionStorage.getItem("lang") as string;
          if (!this.isundefined(ssloc)) {
            loc = ssloc;
          }
        }
        if (loc == "zh" || loc == "zh-CN") {
          loc = "zh-cn";
        }
        this.getFileList(loc).then((res: any) => {
          if (res == null) {
            this.init();
          } else if (res.code >= 20000) {
            if (this.reLogin > 0) {
              this.reLogin -= 1;
              this.init();
            }
          } else {
            if (res.code == 10000) {
              this.filedata = res.data.data;
              // let offset = res.data.offset;
              // let rows = res.data.rows;
              // let total = res.data.total;

              this.handleTableData();
            }
          }
        });
      } else {
        this.handleTableData();
      }
    },

    handleTableData() {
      let lidata = this.filedata;
      let foldPath = "";

      this.bDatas = [];
      const newurl = this.setRouterPush("-", true);
      // console.log(newurl);
      // const rootstring: string = this.$t("page.root");
      const bD: breadcrumbData = { path: newurl, name: this.$t("page.root") };
      this.bDatas.push(bD);
      const path = this.$route.params.fold as string;
      // console.log("<== path ==>", path);
      if (path != undefined && path != null && path != "") {
        const paths = path.split("-");
        for (let i = 0; i < paths.length; i++) {
          const pe = paths[i];
          if (Object.hasOwnProperty.call(lidata, pe)) {
            lidata = lidata[pe];
            if (foldPath != "") {
              foldPath += "-";
            }
            foldPath += pe;
            const newurl = this.setRouterPush(foldPath, true);
            // console.log(newurl);
            const bD: breadcrumbData = { path: newurl, name: pe };
            this.bDatas.push(bD);
          }
        }
      }

      let hash = 0;
      let trList: tableData[] = [];
      for (const lid in lidata) {
        if (Object.hasOwnProperty.call(lidata, lid)) {
          if (lid == "fileList") {
            const fileList = lidata[lid];
            for (const key in fileList) {
              if (Object.hasOwnProperty.call(fileList, key)) {
                let element: tableData = fileList[key];
                if (element.size == "-1") {
                  element.size = "-";
                }
                if (element.describe == "") {
                  element.describe = "-";
                }
                if (!isNaN(Number(element.size))) {
                  let fsize = Number(element.size);
                  if (fsize != -1) {
                    if (fsize / 1024 / 1024 / 1024 > 1) {
                      element.size =
                        (fsize / 1024 / 1024 / 1024).toFixed(2) + " GB";
                    } else if (fsize / 1024 / 1024 > 1) {
                      element.size = (fsize / 1024 / 1024).toFixed(2) + " MB";
                    } else if (fsize / 1024 > 1) {
                      element.size = (fsize / 1024).toFixed(2) + " KB";
                    } else {
                      element.size = fsize.toFixed(2) + " B";
                    }
                  } else {
                    element.size = " - ";
                  }
                }
                element.type = "file";
                // if (element.name == "msd用户操作手册-v2109.pdf") {
                //   element.describe =
                //     "msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册msd用户操作手册";
                // }
                element.progress = undefined;
                trList.push(element);
              }
            }
          } else {
            let link = lid;
            const ele: tableData = {
              name: lid,
              link: link,
              type: "folder",
              hash: hash.toString(),
              describe: "",
              size: "-",
              exist: "0",
              progress: undefined,
            };
            hash += 1;
            trList.push(ele);
          }
        }
      }
      this.tableDatas = trList;
    },

    setRouterPush(val: string, isadd = false): string {
      const urls = this.$route.fullPath.split("/");
      // console.log("window.location.href", urls);
      let newurl = "";
      for (let i = 1; i < urls.length; i++) {
        const e = urls[i];
        newurl += "/";
        if (i == 5) {
          const folderPath = this.$route.params.fold as string;
          const fps = folderPath.split("-");
          if (isadd) {
            newurl += val;
          } else {
            if (fps.length >= 1 && fps[0] != "") {
              newurl += folderPath + "-" + val;
            } else {
              newurl += val;
            }
          }
        } else {
          newurl += e;
        }
      }
      return newurl;
    },

    handleCurrentChange(val: tableData | undefined) {
      // console.log("handleCurrentChange", val);
      if (val != undefined) {
        // console.log(" 111 ");
        if (val.type == "folder") {
          // console.log(" 222 ");
          const newurl = this.setRouterPush(val.name);
          // console.log(" 222 ", newurl);
          this.$router.push({ path: newurl }).then(() => {
            this.handleTableData();
          });
        }
      }
    },

    dl(fhash: string, name: string) {
      const token: string | null = sessionStorage.getItem("exToken");
      if (
        token == undefined ||
        token == "undefined" ||
        token == null ||
        token == ""
      ) {
        this.login(
          this.$route.params.u as string,
          this.$route.params.p as string
        ).then(() => {
          const token: string | null = sessionStorage.getItem("exToken");
          if (token != null) {
            this.dlfile(fhash, name);
          }
        });
      } else {
        this.dlfile(fhash, name);
      }
    },

    dlfile(fhash: string, name: string) {
      // console.log(
      //   "!!@@",
      //
      //   this.$store.state.downloadListVisible,
      //   "@@!!"
      // );

      for (let i = 0; i < this.$store.state.progressList.length; i++) {
        const e = this.$store.state.progressList[i];
        if (this.isundefined(e)) {
          continue;
        }
        if (
          Object.prototype.hasOwnProperty.call(e, "hash") &&
          e.hash == fhash
        ) {
          return;
        }
      }
      const canTS = axios.CancelToken.source();

      this.$store.state.progressList.push({
        hash: fhash,
        name: name,
        p: 0,
        canT: canTS,
      });
      let tabDataIndex = 0;
      for (let i = 0; i < this.tableDatas.length; i++) {
        const element = this.tableDatas[i];
        if (element.hash == fhash) {
          tabDataIndex = i;
        }
      }
      this.downloadFile(
        fhash,
        (e) => {
          const progress = Number((100 * (e.loaded / e.total)).toFixed(0));
          this.tableDatas[tabDataIndex].progress = progress;
          for (let i = 0; i < this.$store.state.progressList.length; i++) {
            const e = this.$store.state.progressList[i];
            if (this.isundefined(e)) {
              continue;
            }
            if (
              Object.prototype.hasOwnProperty.call(
                this.$store.state.progressList[i],
                "hash"
              ) &&
              this.$store.state.progressList[i].hash == fhash
            ) {
              this.$store.state.progressList[i].p = progress;
              break;
            }
          }
        },
        canTS
      ).then((resp: any) => {
        this.tableDatas[tabDataIndex].progress = undefined;
        for (let i = 0; i < this.$store.state.progressList.length; i++) {
          const e = this.$store.state.progressList[i];
          if (this.isundefined(e)) {
            continue;
          }
          if (
            Object.prototype.hasOwnProperty.call(e, "hash") &&
            e.hash == fhash
          ) {
            this.$store.state.progressList.splice(i, 1);
            break;
          }
        }
        if (
          !(
            Object.prototype.hasOwnProperty.call(resp, "name") &&
            resp.name == "CanceledError"
          )
        ) {
          const blob: Blob = resp.data;
          const reader = new FileReader();
          reader.readAsDataURL(blob); // 转换为base64，可以直接放入a表情href
          reader.onload = function (e) {
            // 转换完成，创建一个a标签用于下载
            const a: HTMLAnchorElement = document.createElement("a");
            const nameFile = name;
            a.download = nameFile;
            const blobUrl = URL.createObjectURL(blob);
            a.href = blobUrl;
            // a.onclick = function () {
            // var winOpen = window.open(url, "_blank");
            // if (winOpen == null || typeof winOpen == "undefined") {
            //   alert("请允许弹出窗口");
            // }
            // window.location.href = url;
            // };
            let dwdiv: HTMLDivElement | null = document.getElementById(
              "dw"
            ) as HTMLDivElement | null;
            if (dwdiv != null) {
              dwdiv.append(a); // 修复firefox中无法触发click
              a.click();
              dwdiv.innerHTML = "";
              return e;
            }
          };
        } else if (resp.name == "CanceledError") {
          // console.log("!!!!!!!!!!!");

          if (this.$store.state.progressList.length == 0) {
            // console.log("@@@@@@@@@@@@");

            this.$store.state.downloadListVisible = false;
          }
        }
      });
    },

    jumpFolder(path: string) {
      this.$router.push({ path: path }).then(() => {
        this.handleTableData();
      });
    },
    tooltipStr(len: number, exist: string): string {
      if (len >= this.maxDownLoadCount) {
        return this.$t("tips.maxdownload");
      } else if (len < this.maxDownLoadCount && exist == "1") {
        return this.$t("tips.download");
      } else if (len < this.maxDownLoadCount && exist != "1") {
        return this.$t("tips.noexist");
      }
      return this.$t("tips.download");
    },
    tsnull(len: number, exist: string) {
      // console.log("tsnull", len < this.maxDownLoadCount, exist == "1");
      return len + exist;
    },
  },
});
</script>
<style scoped>
.dlprogress {
  height: 30px;
}
.file-item {
  text-align: left;
}
.item-name {
  padding-left: 5px;
}
.file-item .file-size {
  padding-left: 2px;
  color: grey;
}
</style>
