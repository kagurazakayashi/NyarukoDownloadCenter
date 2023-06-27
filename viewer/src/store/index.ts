import { InjectionKey, State } from "vue";
import { createStore, Store } from "vuex";

// 定义 injection key
export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    downloadListVisible: false,
    progressList: [],
    isDark: false,
  },
});
