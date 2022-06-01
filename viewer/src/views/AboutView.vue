<template>
  <div class="About">
    <h1>This is an about page</h1>
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
    console.log(window.location.href);
  },
});
</script>
