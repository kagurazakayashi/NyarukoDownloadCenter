import { Store } from "vuex";
import { CancelTokenSource } from "axios";

declare module "@vue/runtime-core" {
  interface progressData {
    hash: string;
    name: string;
    p: number;
    canT: CancelTokenSource;
  }
  // 声明自己的 store state
  interface State {
    downloadListVisible: boolean;
    loginDialogVisible: boolean;
    progressList: progressData[];
  }

  // 为 `this.$store` 提供类型声明
  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
