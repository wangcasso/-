<template>
  <div class="map-wrap">
    <el-amap
      ref="map"
      class="map"
      :amap-manager="amapManager"
      :events="mapEvents"
      :zoom="zoom"
      :zooms="[7, 19]"
      :zoomEnable="true"
      :animateEnable="false"
      :scrollWheel="false"
      :doubleClickZoom="false"
    >
      <el-amap-marker
        :vid="`${mType === 1 ? 'city' : 'area'}-${index}`"
        class="selectedMarker"
        v-for="(item, index) in markerList"
        :key="index"
        :position="item.lnglat"
        topWhenClick="true"
        :extData="item"
        :content="getMarkerContent(item)"
        :events="markerEvents"
      ></el-amap-marker>
    </el-amap>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

import { AMapManager, lazyAMapApiLoaderInstance } from "vue-amap";

const amapManager = new AMapManager();

export default {
  props: {
    markerList: {
      type: Array,
      default: [],
    },

    types: {
      type: Number,
      default: 1,
    },

    centerPosition: {
      type: Array,
      default: [],
    },
  },
  data() {
    const self = this;

    return {
      amapManager,

      zoom: 11, // 地图缩放级别

      centerP: [],

      centerDingWei: [],

      mapEvents: {
        init(o) {
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
          self.amapManager.getMap().setStatus({
            zoomEnable: true,
          });
        },
        moveend: () => {
          console.log("map move");
        },
        zoomchange: (e) => {
          const zoom = self.amapManager.getMap().getZoom(); // 获取当前地图级别

          if (zoom <= 11 && self.mType === 2) {
            self.$emit("searchCity");
          }
        },
        click: (e) => {
          console.log("map clicked");
        },
      },

      markerEvents: {
        click(e) {
          const item = e.target.getExtData();

          if (self.mType === 1) {
            // 点击区域,查询网点列表

            self.setMapArea(item.AddressName);

            self.$emit("searchArea", item);
          } else {
            // 点击网点,查询票据列表

            self.setMapBranch(item.AddressName);

            self.$emit("searchBranch", item);
          }
        },
      },

      mType: 1, // 1 市级 2 地区
    };
  },

  computed: {
    ...mapState("bankUndertakeReceipt", [
      "mapCity",

      "mapArea",

      "mapBranch",

      "branchCity",
    ]),
  },

  methods: {
    ...mapMutations("bankUndertakeReceipt", ["setMapArea", "setMapBranch"]),

    getCenter() {
      const that = this;

      const opts = {
        // |商务住宅

        type: "政府机构及社会团体|生活服务",
      };

      const city = this.mapCity === "" ? this.branchCity : this.mapCity;

      const keywords = that.mType === 1 ? city : city + that.mapArea;

      const district = new AMap.PlaceSearch(opts);

      district.setCity(city);

      district.setCityLimit(true);

      console.log(keywords, "查询参数");

      district.search(keywords, (status, result) => {
        console.log(result, "返回参数");

        if (status === "complete") {
          const c = result.poiList.pois[0].location;

          that.centerP = [c.lng, c.lat];
        }
      });

      // return new Promise((resolve, reject) => {

      //   try {

      //     const opts = {

      //       type: '政府机构及社会团体|生活服务|商务住宅',

      //     };

      //     const keywords = that.mType === 1 ? that.mapCity : (that.mapCity + that.mapArea);

      //     const district = new AMap.PlaceSearch(opts);

      //     district.setCity(that.mapCity);

      //     district.setCityLimit(true);

      //     district.search(keywords, (status, result) => {

      //       if (status === 'complete') {

      //         ;

      //         const c = result.poiList.pois[0].location;

      //         resolve([c.lat, c.lng]);

      //       }

      //     });

      //   } catch (err) {

      //     ;

      //   }

      // });
    },

    getMarkerContent(item) {
      const content =
        this.mType === 1
          ? `<div class='marker'>

        <h3><span>${item.AddressName}</span></h3>

        <ul>

            <li>票据 ${item.NotDiscountNum}</li>

            <li>金额 ${item.money}</li>

        </ul>

      </div>

      `
          : `<div class='marker1'>

        <div>${item.AddressName}</div>

        <div>票据 <span>${item.NotDiscountNum}</span> 金额 <span>${item.money}</span></div>

      </div>

      `;

      return content;
    },

    changeZoomAndCenter(zoom, lnglat) {
      const that = this;

      setTimeout(() => {
        const map = that.amapManager.getMap();

        map.setZoomAndCenter(zoom, lnglat);
      }, 20);

      if (this.markerList.length === 0) {
        this.$dialog.toast({
          mes: "暂无数据",

          timeout: 1500,
        });
      }

      this.centerDingWei = [];
    },
  },

  watch: {
    types(newV) {
      this.mType = newV;
    },

    centerPosition(newV) {
      this.centerDingWei = newV;
    },

    centerP(newV) {
      console.log(newV, "centerP的值");

      const zoom = this.mType === 1 ? 11 : 14;

      const pos = this.centerDingWei.length === 0 ? newV : this.centerDingWei;

      this.changeZoomAndCenter(zoom, pos);
    },

    markerList: {
      handler(newV) {
        this.getCenter();
      },

      deep: true,
    },
  },
};
</script>

<style>
.map-wrap {
  position: relative;

  width: 100%;

  height: 100vh;

  overflow: hidden;
}

.map {
  position: relative;

  width: 100%;

  height: 100vh;

  overflow: hidden;

  z-index: 500;
}

.marker {
  width: 90px;

  background: #ffffff;

  box-shadow: 0 0 8px 0 rgba(75, 119, 250, 0.1);

  border-radius: 8px;
}

.marker h3 {
  display: flex;

  align-items: center;

  width: 100%;

  height: 28.5px;

  background-image: linear-gradient(225deg, #ff9953 0%, #ff7635 100%);

  font-family: PingFangSC-Medium;

  font-size: 13px;

  color: #ffffff;

  border-radius: 8px 8px 0 0;
}

.marker h3 span {
  display: inline-block;

  white-space: nowrap;

  text-overflow: ellipsis;

  overflow: hidden;

  width: 61px;
}

.marker h3::before {
  content: "";

  position: relative;

  width: 4px;

  height: 10px;

  background: #ffffff;

  border-radius: 1.25px;

  margin-left: 10px;

  margin-right: 5px;

  vertical-align: middle;

  margin-top: 0.3px;
}

.marker ul {
  padding: 5px 10px;

  font-family: PingFangSC-Medium;

  font-size: 12px;

  color: #333333;
}

.marker ul li {
  white-space: nowrap;

  text-overflow: ellipsis;

  overflow: hidden;
}

.marker1 {
  position: relative;

  width: 130px;

  height: 45.5px;

  padding: 5px 10px;

  background-image: linear-gradient(225deg, #ff9953 0%, #ff7635 100%);

  box-shadow: 0 5px 9px 0 rgba(255, 118, 53, 0.19);

  border-radius: 8px;

  font-family: PingFangSC-Medium;

  font-size: 12px;

  color: #ffffff;

  z-index: 500;
}

.marker1::after {
  content: "";

  position: absolute;

  left: 15px;

  bottom: -9px;

  width: 20px;

  height: 10px;

  background: url("../../../../../images/bankUndertakeReceipt/jiao.png")
    no-repeat;

  background-size: 20px 10px;

  z-index: 499;
}

.marker1 div {
  white-space: nowrap;

  text-overflow: ellipsis;

  overflow: hidden;
}
</style>

