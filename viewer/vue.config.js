// const { defineConfig } = require("@vue/cli-service");
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
// const { ComponentsResolver } = require('unplugin-icons/resolver')

// module.exports = defineConfig({
//   transpileDependencies: true,
// });
// const path = require("path");
// function resolve(dir) {
//   return path.join(__dirname, dir);
// }
module.exports = {
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'File Viewer'
      return args
    })
    config.resolve.alias.set('vue-i18n', 'vue-i18n/dist/vue-i18n.cjs.js'),
    config.plugins.delete('prefetch')
    // config.module.rule('svg').exclude.add(resolve('src/assets/svgs')).end()
    // config.module
    //   .rule("icons")
    //   .test(/\.svg$/)
    //   .include.add(resolve("src/assets/svgs"))
    //   .end()
    //   .use("svg-sprite-loader")
    //   .loader("svg-sprite-loader")
    //   //定义规则 使用时 <svg class="icon"> <use xlink:href="#icon-svg文件名"></use>  </svg>
    //   .options({
    //     symbolId: "icon-[name]"
    //   })
    //   .end();
  },
  configureWebpack: {
    plugins: [
      require('unplugin-vue-components/webpack')({ resolvers: [ElementPlusResolver()], }),
      // require('unplugin-icons/webpack')({ resolvers: [ComponentsResolver()], }),
      require('unplugin-auto-import/webpack')({ resolvers: [ElementPlusResolver()], }),
    ],
  },
  publicPath: "/download/"
}