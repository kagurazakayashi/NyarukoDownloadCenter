import axios, { CancelTokenSource } from "axios";
import { ElNotification } from "element-plus";
import i18n from "../assets/i18n";
import qs from "qs";
// import router from "../router";

const api = "//192.192.1.1:20520";

export default {
  methods: {
    // eslint-disable-next-line
    login(username: string, password: string): any {
      return axios
        .post(
          `${api}/login/`,
          qs.stringify({
            username: username,
            password: password,
            isScan: 1,
          })
        )
        .then((resp) => {
          if (resp.data.code == 10000) {
            const token = resp.data.data;
            sessionStorage.setItem("exToken", token);
            sessionStorage.setItem("user", username);
          }
          return resp.data;
        })
        .catch((error) => {
          this._errorhandling(error, false);
          return error.response;
        });
    },

    // eslint-disable-next-line
    logout(): any {
      const token = sessionStorage.getItem("exToken");
      if (token == null || token == "") {
        this._backlogin();
        return new Promise(function (_resolve) {
          _resolve({ code: -1 });
        });
      }
      return axios
        .post(
          `${api}/logout/`,
          qs.stringify({
            t: token,
          })
        )
        .then((resp) => {
          return resp.data;
        })
        .catch((error) => {
          this._errorhandling(error, false);
          return error.response;
        });
    },

    // eslint-disable-next-line
    getFileList(loc = "en"): any {
      const token = sessionStorage.getItem("exToken");
      if (
        token == undefined ||
        token == "undefined" ||
        token == null ||
        token == ""
      ) {
        return new Promise(function (_resolve) {
          _resolve({ code: -1 });
        });
      }
      return axios
        .post(
          `${api}/fileList/`,
          qs.stringify({
            t: token,
            offset: 0,
            rows: 500,
            localeCode: loc,
          })
        )
        .then((resp) => {
          return resp.data;
        })
        .catch((error) => {
          this._errorhandling(error, true);
          return error.response;
        });
    },

    downloadFile(
      fhash: string,
      // eslint-disable-next-line
      progress: (e: any) => void,
      cancelTSource: CancelTokenSource
    ) {
      const token = sessionStorage.getItem("exToken");
      if (
        token == undefined ||
        token == "undefined" ||
        token == null ||
        token == ""
      ) {
        return new Promise(function (_resolve) {
          _resolve({ code: 4000 });
        });
      }
      return axios
        .post(
          `${api}/fileDownload/`,
          qs.stringify({
            t: token,
            fh: fhash,
            path: 1,
          }),
          {
            responseType: "blob",
            cancelToken: cancelTSource.token,
            onDownloadProgress: progress,
          }
        )
        .then((resp) => {
          return resp;
        })
        .catch((error) => {
          if (
            Object.prototype.hasOwnProperty.call(error, "name") &&
            error.name == "CanceledError"
          ) {
            return error;
          } else {
            const blob: Blob = error.response.data;
            const reader = new FileReader();
            reader.readAsText(blob, "utf8"); // 转换为base64，可以直接放入a表情href
            reader.onload = (e) => {
              const msgData = JSON.parse(e.target?.result as string);
              const msg = {
                response: {
                  data: msgData,
                },
              };
              this._errorhandling(msg, true);
              return msgData;
            };
          }
        });
    },

    // eslint-disable-next-line
    _errorhandling(error: any, isbacklogin = true) {
      let err: string = error.message;
      let code = 0;
      // eslint-disable-next-line
      const resp: any | null = error.response;
      let p = "";
      if (resp != null) {
        if (typeof resp.data !== "string") {
          err = error.response.data.msg;
          code = error.response.data.code;
          if (error.response.data.p) {
            p = error.response.data.p;
          }
          if (error.response.data.err) {
            p = error.response.data.err;
          }
        }
      }
      ElNotification({
        title: i18n.global.t("state.error"),
        message: err + (p == "" ? p : "[" + p + "]"),
        type: "error",
      });
      if (isbacklogin && (code == 4000 || code == 3900)) {
        this._backlogin(err);
      }
    },

    _backlogin(notifMsg = "") {
      if (notifMsg != "") {
        ElNotification({
          title: i18n.global.t("state.error"),
          message: notifMsg,
          type: "error",
        });
      }
      sessionStorage.removeItem("exToken");
      // router.push({ name: "login" });
    },
  },
};
