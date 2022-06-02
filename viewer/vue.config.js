// const { defineConfig } = require("@vue/cli-service");
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");

// module.exports = defineConfig({
//   transpileDependencies: true,
// });
module.exports = {
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].title = "Download Center";
      return args;
    });
    config.resolve.alias.set("vue-i18n", "vue-i18n/dist/vue-i18n.cjs.js"),
      config.plugins.delete("prefetch");
  },
  configureWebpack: {
    plugins: [
      require("unplugin-vue-components/webpack")({
        resolvers: [ElementPlusResolver()],
      }),
      // require('unplugin-icons/webpack')({ resolvers: [ElementPlusResolver()], }),
      require("unplugin-auto-import/webpack")({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
  publicPath: "/download/",
};
