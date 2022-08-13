<template>
  <div class="About">
    <h1>{{ $t("text.welcome") }}</h1>
    <p>&emsp;</p>
    <p>
      <el-button type="success" @click="$store.state.loginDialogVisible = true">
        {{ $t("button.login") }}
      </el-button>
    </p>
    <p>
      <el-button @click="$router.push({ name: 'goto' })">
        {{ $t("goto.title") }}
      </el-button>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  data() {
    return {};
  },
  mixins: [],
  components: {},
  mounted() {
    const token = sessionStorage.getItem("exToken");
    if (token == null || token == "") {
      this.$store.state.loginDialogVisible = true;
    }
    // console.log(window.location.href);
  },
});
</script>
