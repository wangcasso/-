import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueAMap from 'vue-amap'
VueAMap.initAMapApiLoader({
   key: '3ecfa09f471540b3ccb0377b580b16c6',
   // 插件集合
   plugin: ['AMap.Autocomplete','AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.GeometryUtil',/*  'AMap.OverView', 'AMap.ToolBar', 'AMap.MapType', 'AMap.PolyEditor', 'AMap.CircleEditor' */],
   // 高德 sdk 版本，默认为 1.4.4
   v: '1.4.12'
})
Vue.use(VueAMap);
Vue.config.productionTip = false
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
