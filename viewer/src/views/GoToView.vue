<template>
  <div class="GoTo">
    <h1 v-show="$store.state.isDark" style="color: #fff">
      {{ $t("goto.title") }}
    </h1>
    <h1 v-show="!$store.state.isDark" style="color: #204472">
      {{ $t("goto.title") }}
    </h1>
    <el-row justify="center" align="middle">
      <el-col>
        <el-autocomplete
          v-model="autoCompleteValue"
          :fetch-suggestions="querySearch"
          :trigger-on-focus="false"
          clearable
          style="width: 100%"
          :placeholder="$t('goto.input')"
        /> </el-col
    ></el-row>
    <el-row justify="center" align="middle"
      ><p>
        <el-button type="success" icon="FolderOpened" @click="goto()">{{
          $t("button.extract")
        }}</el-button>
      </p></el-row
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import urlAPI from "@/services/api";
import { ElMessage } from "element-plus";
interface RestaurantItem {
  value: string;
}
interface type {
  autoCompleteValue: string;
}
let restaurants = ref<RestaurantItem[]>([]);

export default defineComponent({
  data() {
    return { autoCompleteValue: "" } as type;
  },
  mixins: [urlAPI],
  components: {},
  mounted() {
    // console.log(window.location.href);
    this.userList().then((res: any) => {
      if (res == null || res.code != 10000) {
        return;
      }
      const userNames: string[] = res.data.data as string[];
      let selects: RestaurantItem[] = [];
      for (const userName of userNames) {
        selects.push({ value: userName });
      }
      restaurants.value = selects;
    });
  },
  methods: {
    querySearch(queryString: string, cb: any) {
      const results = queryString
        ? restaurants.value.filter(this.createFilter(queryString))
        : restaurants.value;
      // call callback function to return suggestions
      cb(results);
    },
    // handleSelect() {
    //   // console.log(item);
    //   // console.log(this.autoCompleteValue);
    //   this.goto();
    // },
    loadAll(ri: RestaurantItem[]) {
      return ri;
    },
    createFilter(queryString: string) {
      return (restaurant: RestaurantItem) => {
        return (
          restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) ===
          0
        );
      };
    },
    goto() {
      let isOK = false;
      for (const iterator of restaurants.value) {
        if (iterator.value == this.autoCompleteValue) {
          isOK = true;
          break;
        }
      }
      if (!isOK) {
        ElMessage.error(this.$t("tips.notfound"));
        return;
      }
      this.login(this.autoCompleteValue, this.autoCompleteValue).then(() => {
        this.$router.push({
          name: "f",
          params: {
            loc: this.$i18n.locale,
            u: this.autoCompleteValue,
            p: this.autoCompleteValue,
            fold: "-",
          },
        });
      });
    },
  },
});
</script>
<style scoped></style>
