<template>
  <div>
    <div class="text">{{ mapTitle }}</div>
    <el-amap
      ref="amap"
      :amap-manager="amapManager"
      :events="mapEvents"
      :zoom="zoom"
      :expandZoomRange="true"
      :center="center"
      :zoomEnable="false"
      :dragEnable="false"
      :touchZoom="false"
      :scrollWheel="false"
      vid="amapDemo"
      :style="{
        width: '100%',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0, 0.5)',
        borderRadius: '6px',
      }"
    >
      <!-- <el-amap-marker /> -->
      <el-amap-marker
        :offset="[-10, -26]"
        点的偏移量
        :events="{
          // 事件监听
          init(m) {
            // 事件监听
            // m.on('mouseover', () => dosomething);
            // m.on('mouseout', () => dosomething);
          },
        }"
        :position="[20, 20]"
        点的位置
        animation="AMAP_ANIMATION_BOUNCE"
        点的动画
        icon="图片路径"
        图标
      />
    </el-amap>
  </div>
</template>

<script>
import { AMapManager } from "vue-amap";
const amapManager = new AMapManager();
export default {
  data() {
    const self = this;
    return {
      amapManager,
      mapTitle: "地图测试",
      zoom: [18],
      center: [0, 0],
      mapEvents: {
        init(o) {
          console.log("🚀 ~ file: AboutView.vue:54 ~ init ~ o:", o);

          window.AMap.plugin("AMap.Geolocation", function () {
            var geolocation = new window.AMap.Geolocation({
              // 是否使用高精度定位，默认：true
              enableHighAccuracy: true,
              // 设置定位超时时间，默认：无穷大
              timeout: 10000,
              // 定位按钮的停靠位置的偏移量，默认：Pixel(10, 20)
              buttonOffset: new window.AMap.Pixel(10, 20),
              //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
              zoomToAccuracy: true,
              //  定位按钮的排放位置,  RB表示右下
              buttonPosition: "RB",
              GeoLocationFirst: true,
            });

            geolocation.getCurrentPosition();
            window.AMap.event.addListener(geolocation, "complete", onComplete);
            window.AMap.event.addListener(geolocation, "error", onError);

            function onComplete(data) {
              console.log("🚀 定位成功 data:", data);
              // data是具体的定位信息
              self.center = [data.position.lng, data.position.lat];
              self.addNowPostion(self.center);
            }

            function onError(data) {
              console.log("🚀定位失败 ~ data:", data);
              // new window.AMap.Map("container", {
              //   resizeEnable: true,
              // });
              window.AMap.plugin("AMap.CitySearch", function () {
                var citySearch = new window.AMap.CitySearch();
                citySearch.getLocalCity(function (status, result) {
                  if (status === "complete" && result.info === "OK") {
                    self.center = [
                      result.bounds.getCenter().lng,
                      result.bounds.getCenter().lat,
                    ];

                    console.log(
                      "🚀 ~ file: AboutView.vue:96 ~ result:",
                      result.bounds.getCenter()
                    );
                    // 查询成功，result即为当前所在城市信息
                  }
                });
              });
            }
          });

          // lazyAMapApiLoaderInstance.load().then(() => {
          //   // self.initPage() // 初始化数据self指向this
          //   // self.changeMap() // 绑定鼠标缩放事件
          // });
          // o.getCurrentPosition((status, result) => {
          //   ;
          //   if (result && result.position) {
          //     // self.address = result.formattedAddress;
          //     // self.lng = result.position.lng;
          //     // self.lat = result.position.lat;
          //     // self.center = [self.lng, self.lat];
          //     // self.loaded = true;
          //     // self.$nextTick();
          //   }
          // });
        },
        complete() {
          const map = self.amapManager.getMap(); // 获取地图组件实例
          console.log("🚀 ~ file: AboutView.vue:74 ~ complete ~ map:", map);
          // self.amapManager.getMap().setStatus({
          //   zoomEnable: true,
          // });
        },
        moveend: () => {
          console.log("map move");
        },
        zoomchange: (e) => {
          console.log("🚀 ~ file: AboutView.vue:83 ~ data ~ e:", e);
          const zoom = self.amapManager.getMap().getZoom(); // 获取当前地图级别

          if (zoom <= 11 && self.mType === 2) {
            self.$emit("searchCity");
          }
        },
        click: (e) => {
          console.log("🚀 ~ file: AboutView.vue:91 ~ data ~ e:", e);
          console.log("map clicked");
        },
      },
    };
  },
  methods: {
    addNowPostion(position) {
      // 创建一个 Marker 实例：
      var marker = new window.AMap.Marker({
        position: new window.AMap.LngLat(...position), // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
        animation: "AMAP_ANIMATION_DROP",
        shadow: new window.AMap.Circle({
          map: this.amapManager.getMap(),
          center: position,
          radius: 1000,
          strokeColor: "#3285ff",
          strokeOpacity: 1,
          strokeWeight: 1,
          strokeStyle: "solid",
          fillColor: "#3285ff",
          fillOpacity: "0.1",
        }),
        // title: "北京",
      });

      // 将创建的点标记添加到已有的地图实例：
      amapManager.getMap().add(marker);

      // 移除已创建的 marker
      // amapManager.remove(marker);
    },
  },
};
</script>

<style>
</style>