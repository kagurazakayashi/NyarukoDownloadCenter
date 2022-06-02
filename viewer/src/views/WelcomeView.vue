<template>
  <div class="About">
    <h1>Welcome</h1>
    <el-button @click="$store.state.loginDialogVisible = true">
      Login
    </el-button>
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
