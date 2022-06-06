<template>
  <div class="GoTo">
    <h1>{{ $t("goto.title") }}</h1>
    <el-row justify="center" align="middle">
      <el-col>
        <el-autocomplete
          v-model="state1"
          :fetch-suggestions="querySearch"
          :trigger-on-focus="false"
          clearable
          style="width: 100%"
          :placeholder="$t('goto.input')"
          @select="handleSelect"
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
  state1: string;
}
const restaurants = ref<RestaurantItem[]>([]);

export default defineComponent({
  data() {
    return { state1: "" } as type;
  },
  mixins: [urlAPI],
  components: {},
  mounted() {
    console.log(window.location.href);
    this.userList().then(
      // eslint-disable-next-line
      (res: any) => {
        if (res == null || res.code != 10000) {
          return;
        }
        const userNames: string[] = res.data.data as string[];
        const selects: RestaurantItem[] = [];
        for (const userName of userNames) {
          selects.push({ value: userName });
        }
        restaurants.value = selects;
      }
    );
  },
  methods: {
    querySearch(queryString: string, cb: any) {
      const results = queryString
        ? restaurants.value.filter(this.createFilter(queryString))
        : restaurants.value;
      // call callback function to return suggestions
      cb(results);
    },
    handleSelect(item: RestaurantItem) {
      console.log(item);
    },
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
        if (iterator.value == this.state1) {
          isOK = true;
          break;
        }
      }
      if (!isOK) {
        ElMessage.error(this.$t("tips.notfound"));
        return;
      }
      this.login(this.state1, this.state1).then(() => {
        this.$router
          .push({
            name: "f",
            params: {
              loc: this.$i18n.locale,
              u: this.state1,
              p: this.state1,
              fold: "-",
            },
          })
          .then(() => {
            this.$router.go(0);
          });
      });
    },
  },
});
</script>
<style scoped></style>
