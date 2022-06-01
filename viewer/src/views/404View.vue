<template>
  <div class="NoFind">
    <h1>404 !!!</h1>
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
