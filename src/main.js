import Vue from 'vue'
import App from './App.vue'
// 引入路由文件
import router from './router/index'

Vue.config.productionTip = false

new Vue({
  el: '#app',
  // 引入路由对象
  router,
  render: h => h(App)
})
