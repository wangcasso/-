<template>
  <div class="likeWeChatMap">
    <div class="header">
      <div class="back" @click.stop.prevent="backFn">取消</div>
      <div
        class="done"
        :class="{ dont: !isSelect() }"
        @click.stop.prevent="doneFn"
      >
        确定
      </div>
    </div>
    <el-amap
      ref="amap"
      :amap-manager="amapManager"
      :events="mapEvents"
      :zoom="zoom"
      :expandZoomRange="true"
      :center="center"
      :zoomEnable="false"
      :dragEnable="true"
      :touchZoom="false"
      :scrollWheel="true"
      vid="amapDemo"
      :style="{
        width: '100%',
        height: 100 - listH + 'vh',
        backgroundColor: 'rgba(0,0,0, 0.5)',
      }"
    >
      <!-- <el-amap-marker /> -->
      <!-- <el-amap-marker
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
      /> -->
    </el-amap>
    <div
      class="vh70"
      :style="{ height: 100 - listH + 'vh' }"
      v-show="!isInit"
    ></div>

    <div
      id="listBox"
      :style="{
        height: listH + 'vh',
      }"
      :class="{ moreBtn: listH > 50 }"
    >
      <div
        class="mark"
        :style="{ position: darkMarkFullScreen && 'fixed' }"
        @touch.stop.prevent
        @click.stop.prevent
        v-show="loading"
      >
        <div class="rollImg"></div>
      </div>
      <div class="searchBar" :class="{ noArrow: listH < 50 }">
        <div
          v-show="listH > 50"
          class="downArrow"
          @click="
            () => {
              listH = listPercentage;
            }
          "
        ></div>
        <div class="inputDom">
          <input
            type="search"
            class="searchWindow"
            :class="{ noRightMargin: cancelBtnShow }"
            v-model.trim="searchValue"
            placeholder="搜索地点"
            @focus="searchFocusFn"
            @blur="searchBlurFn"
            @input="searchBarFn"
          />
          <div class="cancelBtn" v-show="cancelBtnShow" @click="cancelFn">
            取消
          </div>
        </div>
      </div>
      <div
        class="scrollBox"
        ref="scrollBoxDom"
        :style="{
          height: 'calc(' + listH + 'vh - ' + listH < 50 ? '46px' : '96' + ')',
        }"
        @touchstart="touchStart"
        @touchmove="touchMove"
      >
        <div
          class="listItem"
          v-for="(item, index) in aroundList"
          :key="item.id"
          @click="listClick(item, index)"
        >
          <div v-if="item.id">
            <div class="name" v-html="item.name"></div>
            <div class="dAndA">
              <span class="distanceCss">{{ item.distance }}m</span> |
              <span class="addressCss">{{ item.address }}</span>
            </div>
          </div>
          <div
            v-else-if="item.info === 'SUCCESS' || item.returnMsg === 'success'"
          >
            <div class="myPosition">我的位置</div>
            <div class="name">{{ item.formattedAddress || item.address }}</div>
          </div>
          <div v-else-if="item.adcode">
            <div class="myPosition">坐标位置</div>
            <div class="name">{{ item.formattedAddress }}</div>
            <!-- <div class="dAndA">
              <span class="distanceCss">{{ item.distance }}m</span> |
              <span class="addressCss">{{ item.formattedAddress }}</span>
            </div> -->
          </div>
          <div class="selected" v-show="selectJudgment(item, index)"></div>
        </div>
        <div
          class="tip"
          v-show="loadStatus === 'noMore' && aroundList.length > 0"
        >
          {{ tipObj[loadStatus] }}
        </div>
        <div class="empty" v-show="loadStatus === 'empty'">
          <span>抱歉，您搜索的地址超出规定范围或不存在</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AMapManager } from "vue-amap";
// import native from 'src/servers/native';
let native = {};
let AMap = window.AMap;
function getDirection(x, y) {
  if (x > y) {
    return "horizontal";
  }

  if (y > x) {
    return "vertical";
  }

  return "";
}

const amapManager = new AMapManager();
export default {
  data() {
    const self = this;

    return {
      // vueImg: require("src/images/position.png"),
      amapManager,
      zoom: [16],
      center: [0, 0],
      nowLocal: {},
      lastAddress: "",
      lastPoint: {},
      selectedIndex: 0,
      MAP: null,
      isInit: false,
      tipObj: {
        empty: "抱歉，您搜索的地址超出规定范围或不存在",
        noMore: "——暂无更多地点信息——",
      },
      loadStatus: "",
      draggingtimer: 0,
      mapEvents: {
        init(o) {
          let AMap = window.AMap;

          self.isInit = true;
          console.log("🚀 ~ file: AboutView.vue:54 ~ init ~ o:", o);

          if (!self.MAP) {
            self.loading = true;

            amapManager.getMap().plugin("AMap.Geolocation", () => {
              const geolocation = new AMap.Geolocation({
                // 是否使用高精度定位，默认：true
                enableHighAccuracy: true,
                // 设置定位超时时间，默认：无穷大
                timeout: 10000,
                // 定位按钮的停靠位置的偏移量，默认：Pixel(10, 20)
                buttonOffset: new AMap.Pixel(16, 16),
                //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                // zoomToAccuracy: true,
                //  定位按钮的排放位置,  RB表示右下
                showCircle: false, // 定位成功后用圆圈表示定位精度范围，默认：true
                showButton: true, // 显示定位按钮，默认：true
                buttonPosition: "LB",
                GeoLocationFirst: true,
              });
              amapManager.getMap().addControl(geolocation);

              function onComplete(data) {
                console.log("🚀 定位成功 data:", data);
                // data是具体的定位信息
                self.afterGetCenter(data);
              }

              function onError() {
                console.log("🚀地图定位失败 ~ data:");
                window.getLocationCallBack = (data) => {
                  console.log(
                    "🚀 ~ file: index.vue:222 ~ onError ~ data:",
                    data
                  );
                  if (data && data.returnMsg === "success") {
                    self.afterGetCenter(data, true);
                  }
                };
                if (window.$native) {
                  console.log("尝试使用赢家原生定位");
                  window.$native.genPromise(
                    window.$native.genArgs(
                      { functionName: "getLocationCallBack" },
                      "startPositioning",
                      ""
                    ),
                    "startPositioning"
                  );
                }

                // if (window.confirm('定位失败,请开启定位功能后重试')) {
                //   window.location.reload();
                // } else {
                //   this.$router.back();
                // }
              }
              geolocation.getCurrentPosition();
              AMap.event.addListener(geolocation, "complete", onComplete);
              AMap.event.addListener(geolocation, "error", onError);
            });
          }
        },
        complete() {
          console.log(
            "🚀 ~ file: AboutView.vue:274 ~ complete ~ MAP:",
            this.MAP
          );
          // self.amapManager.getMap().setStatus({
          //   zoomEnable: true,
          // });
        },
        movestart: () => {
          // console.log("map move");
        },
        dragging: () => {
          self.listH = self.listPercentage;

          if (self.searchValue) return;
          // self.MAP.getCenter();
          let position = [self.MAP.getCenter().lng, self.MAP.getCenter().lat];
          if (self.blueCircle.contains(position)) {
            self.addClickMarker(position, true);
            console.log("map dragging", self.MAP && self.MAP.getCenter());
          } else {
            clearTimeout(self.draggingtimer);
            self.draggingtimer = setTimeout(() => {
              self.MAP.setCenter(this.clickMaker.getPosition());
            }, 200);
          }

          // self.listH = self.listPercentage;
        },
        click: () => {
          console.log("map click");
          self.listH = self.listPercentage;
        },
        zoomchange: (e) => {
          console.log("🚀 ~ file: AboutView.vue:290 ~ data ~ e:", e);
          const zoom = self.amapManager.getMap().getZoom(); // 获取当前地图级别
          console.log(zoom);
          // if (zoom <= 11 && self.mType === 2) {
          //   self.$emit("searchCity");
          // }
        },
        // click: (e) => {
        //   console.log("🚀 ~ file: AboutView.vue:91 ~ data ~ e:", e);
        //   console.log("map clicked");
        // },
      },
      blueCircle: "", // 范围实例
      placeSearch: {}, // 搜索实例
      pageIndex: 1,
      cacheList: [], // 连续请求缓存数组
      aroundList: [
        // {
        //   id: 'B0FFF4N4QE',
        //   name: '信息科技中心',
        //   type: '商务住宅;楼宇;商务写字楼',
        //   location: {
        //     Q: 22.508033,
        //     R: 114.04573700000003,
        //     lng: 114.045737,
        //     lat: 22.508033,
        //   },
        //   address: '市花路16号',
        //   tel: '',
        //   distance: 48,
        //   shopinfo: '0',
        //   toCenterDistance: 48.404689396374486,
        // },
        // {
        //   id: 'B0FFL1RU1M',
        //   name: '广东信息科技中心深发展信息科技大楼',
        //   type: '商务住宅;楼宇;商务写字楼',
        //   location: {
        //     Q: 22.507815,
        //     R: 114.04581400000001,
        //     lng: 114.045814,
        //     lat: 22.507815,
        //   },
        //   address: '市花路与平冠道交叉口西北80米',
        //   tel: '',
        //   distance: 51,
        //   shopinfo: '0',
        //   toCenterDistance: 51.316004048558796,
        // },
      ], // 最终展示地址数组
      cancelList: [], // 取消时恢复的列表
      markerList: [],
      markerInfoList: [],
      cancelBtnShow: false,
      clickMaker: null,
      centerRadius: 600,
      clickRadius: 100,
      searchValue: "",
      timer: 0,
      listPercentage: 30,
      listH: 30,
      loading: true,
      // queryStatus: "complete",
      // cacheParam: {},
      // lockForchangeH: false,
      direction: "",
      deltaX: 0,
      deltaY: 0,
      offsetX: 0,
      offsetY: 0,
      centerMaker: "",
      darkMarkFullScreen: false,
    };
  },
  watch: {
    // searchValue: {
    //   handler(newV) {
    //     if (newV) {
    //       clearTimeout(this.timer);
    //       this.timer = setTimeout(() => {
    //         console.log(newV);
    //         this.searchBarFn();
    //       }, 500);
    //     } else {
    //       clearTimeout(this.timer);
    //       // this.aroundList = [];
    //       // this.loadStatus = "";
    //     }
    //   },
    // },
    lastAddress: {
      handler(newV) {
        console.log("🚀 ~ file: AboutView.vue:382 ~ handler ~ newV:", newV);
        if (newV === "" && this.clickMaker) {
          this.clickMaker.hide();
        }
      },
    },
    listH: {
      handler(newV, oldV) {
        if (newV < 50 && oldV > 50 && this.loadStatus === "empty") {
          this.cancelFn();
          this.loadStatus = "";
        }
      },
    },
  },
  methods: {
    backFn() {
      // this.$router.back();
      native.$closeWindow();
    },
    isSelect() {
      if (
        this.lastAddress &&
        this.aroundList[this.selectedIndex] &&
        this.aroundList[this.selectedIndex].formattedAddress ===
          this.lastAddress.formattedAddress
      ) {
        return true;
      }
      return false;
    },
    doneFn() {
      if (!this.isSelect()) return;
      native.$injectNativeEventPara(
        JSON.stringify({ type: "1", para: this.lastAddress })
      );
      // console.log(
      //   '选择了',
      //   this.lastAddress.formattedAddress,
      //   this.lastAddress,
      // );
      native.$closeWindow();
    },
    afterGetCenter(data, userNative) {
      let province = "";

      if (!userNative) {
        province = data.addressComponent.province;
        this.center = [data.position.lng, data.position.lat];
        this.lastPoint = [data.position.lng, data.position.lat];
      } else {
        province = data.province;
        data.formattedAddress = data.address;
        this.center = [data.Longitude, data.Latitude];
        this.lastPoint = [data.Longitude, data.Latitude];
      }
      this.addNowPostion(this.center);
      this.addClickMarker(this.center);

      this.nowLocal = data;
      this.nowLocal.formattedAddress = data.formattedAddress.replace(
        province,
        ""
      );

      this.lastAddress = data;
      if (userNative) {
        this.addNowPostion(this.center);
      }
      if (!this.MAP) {
        this.MAP = this.amapManager.getMap(); // 获取地图组件实例
        const timer = setInterval(() => {
          if (window.document.querySelector(".amap-geo")) {
            window.document
              .querySelector(".amap-geo")
              .addEventListener("click", () => {
                this.searchValue = "";
                this.loading = true;
                this.darkMarkFullScreen = true;
              });
            clearInterval(timer);
          }
        }, 500);
      }
      this.listH = this.listPercentage;

      this.searchNearLocal({ keyWord: "", init: 1 });
    },

    addNowPostion(position) {
      // 创建一个 Marker 实例：
      // new AMap.Marker({
      //   position: new AMap.LngLat(...position), // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
      //   animation: 'AMAP_ANIMATION_DROP',
      //   // title: "北京",
      // });
      let AMap = window.AMap;
      if (!this.blueCircle) {
        this.blueCircle = new AMap.Circle({
          map: this.amapManager.getMap(),
          center: new AMap.LngLat(...position),
          bubble: false,
          radius: 500,
          strokeColor: "#3285ff",
          strokeOpacity: 0.1,
          strokeWeight: 1,
          strokeStyle: "solid",
          fillColor: "#3285ff",
          fillOpacity: "0.1",
        });
        this.blueCircle.on("click", this.showInfo);

        // 将创建的点标记添加到已有的地图实例：
        amapManager.getMap().add(this.blueCircle);

        // 移除已创建的 marker
        // amapManager.remove(marker);
      } else {
        this.blueCircle.setCenter(new AMap.LngLat(...position));
      }
    },
    showInfo(e) {
      const text = `您在 [ ${e.lnglat.getLng()},${e.lnglat.getLat()} ] 的位置点击了marker！`;
      console.log(text);
      // let that = this;
      // console.log(e);
      this.searchValue = "";

      this.addClickMarker([e.lnglat.getLng(), e.lnglat.getLat()], true);
    },
    geocoderGetAddress(pos) {
      // [e.lnglat.getLng(), e.lnglat.getLat()]
      var geocoder = new window.AMap.Geocoder();
      let that = this;
      geocoder.getAddress(pos, function (status, result) {
        console.log(status, result);
        if (status === "complete" && result.regeocode) {
          // console.log(status, result);
          that.nowLocal = {}; //result.regeocode
          that.nowLocal.adcode = 1;
          that.nowLocal.position = pos;
          that.nowLocal.formattedAddress =
            result.regeocode.formattedAddress.replace(
              result.regeocode.addressComponent.province,
              ""
            );
          that.lastAddress = that.nowLocal;
        } else {
          console.log("根据经纬度查询地址失败");
        }
      });
    },

    searchNearLocal({ keyWord, point, init, from }) {
      // if (this.queryStatus !== "complete") {
      //   this.cacheParam = { keyWord, point, init };
      //   return;
      // }
      if (init) {
        this.pageIndex = 1;
        this.aroundList = [];
        this.cacheList = [];
        this.loadStatus = "";
      }
      // this.selectedIndex = "";
      const that = this;
      let AMap = window.AMap;

      AMap.plugin(["AMap.PlaceSearch"], () => {
        // 构造地点查询类
        that.placeSearch = new AMap.PlaceSearch({
          // type: "商务住宅", // 兴趣点类别
          type: "汽车服务|汽车销售|汽车维修|摩托车服务|餐饮服务|购物服务|生活服务|体育休闲服务|医疗保健服务|住宿服务|风景名胜|商务住宅|政府机构及社会团体|科教文化服务|交通设施服务|金融保险服务|公司企业|道路附属设施|地名地址信息|公共设施",
          pageSize: 50, // 单页显示结果条数
          pageIndex: that.pageIndex ? that.pageIndex : 1, // 页码
          // city: "010", // 兴趣点城市
          // citylimit: true,  //是否强制限制在设置的城市内搜索
          // map: that.amapManager.getMap(),
          // panel: "listBox", // 结果列表将在此容器中进行展示。
          extensions: "all",
          autoFitView: false, // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
        });
        // https://lbs.amap.com/demo/jsapi-v2/example/poi-search/keywords-search

        const cpoint = point || that.center;
        const radio = point
          ? that.clickRadius
          : that.centerRadius; /* [e.lnglat.getLng(), e.lnglat.getLat()]; */ // 中心点坐标
        that.loading = true;
        // console.log(
        //   "搜索关键词",
        //   keyWord,
        //   "\n",
        //   "坐标",
        //   cpoint,
        //   "\n",
        //   "范围",
        //   radio
        // );
        that.placeSearch.searchNearBy(
          keyWord,
          cpoint,
          radio,
          (status, result) => {
            console.log(status, that.pageIndex, result);
            // that.queryStatus = status;
            // console.log(that.queryStatus);
            // this.cacheParam={ keyWord, point }
            if (status === "complete") {
              if (
                that.searchValue !== keyWord ||
                JSON.stringify(cpoint) !== JSON.stringify(that.lastPoint)
              ) {
                that.pageIndex = 1;
                that.aroundList = [];
                that.cacheList = [];
                that.loadStatus = "";
                return;
              }
              that.cacheList.push(...result.poiList.pois);
              ++that.pageIndex;
              that.searchNearLocal({ keyWord, point, from });
            } else {
              if (that.cacheList.length > 0) {
                that.loadStatus = "noMore";
              } else {
                that.loadStatus = "empty";
              }
              if (!keyWord && !point) {
                that.cacheList.unshift(that.nowLocal);
                that.selectedIndex = 0;
              }

              that.aroundList = that.cacheList;

              // that.queryStatus = "complete";
              console.log(
                "that.aroundList",
                that.aroundList.length,
                that.aroundList
              );
              if (point) {
                that.aroundList.forEach((ele) => {
                  ele.distance = AMap.GeometryUtil.distance(
                    that.center,
                    ele.location
                  ).toFixed();
                });
                that.aroundList = that.aroundList.sort(
                  (a, b) => a.distance - b.distance
                );
                that.lastAddress = that.aroundList[0];
              }
              if (from === "click") {
                that.cacheList.unshift(that.nowLocal);
                that.lastAddress = that.nowLocal;
                that.selectedIndex = 0;
              }

              if (keyWord) {
                that.aroundList.forEach((ele) => {
                  if (ele.name.includes(keyWord)) {
                    ele.name = ele.name.replace(
                      new RegExp(keyWord, "g"),
                      `<span class="greenName">${keyWord}</span>`
                    );
                    // console.log(
                    //   ele.name,
                    //   ele.name.replace(
                    //     "/" + keyWord + "/",
                    //     `<i class="greenName">${keyWord}</i>`
                    //   )
                    // );
                  }
                });
                // that.lastAddress = "";
              } else {
                that.cancelList = that.aroundList;
              }

              that.loading = false;
              that.darkMarkFullScreen = false;

              // that.addMarkerList();//地图标记
            }
          }
        );
      });
    },
    searchBarFn() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!this.searchValue) return;
        this.lastPoint = this.center;
        this.searchNearLocal({ keyWord: this.searchValue, init: 1 });
      }, 500);

      // this.placeSearch.searchInBounds(
      //   this.searchValue,
      //   this.blueCircle,
      //   (status, result) => {
      //     console.log(status, result);
      //   }
      // );
    },
    // addMarkerList() {
    //   // 批量标记
    //   const that = this;
    //   function createContent(poi) {
    //     // 信息窗体内容
    //     const s = [];
    //     s.push(`<b>名称：${poi.name}</b>`);
    //     s.push(`地址：${poi.address}`);
    //     s.push(`电话：${poi.tel}`);
    //     s.push(`类型：${poi.type}`);
    //     return s.join("<br>");
    //   }
    //   this.aroundList.forEach((item, index) => {
    //     this.markerList[index] = new AMap.Marker({
    //       map: that.amapManager.getMap(),
    //       position: item.location,
    //       // icon:
    //       //   "https://webapi.amap.com/theme/v1.3/markers/n/mark_b" +
    //       //   (index + 1) +
    //       //   ".png",
    //     });
    //     this.markerList[index].on("click", () => {
    //       this.markerInfoList[index].open(
    //         that.amapManager.getMap(),
    //         item.location
    //       );
    //       console.log(item);
    //     });
    //     this.markerInfoList[index] = new AMap.InfoWindow({
    //       autoMove: true,
    //       offset: { x: 0, y: -30 },
    //     });
    //     this.markerInfoList[index].setContent(createContent(item));
    //   });
    // },
    addClickMarker(position, needSearch) {
      console.log("点标记执行");
      const that = this;
      this.lastPoint = position;
      let AMap = window.AMap;
      if (!this.clickMaker) {
        this.clickMaker = new AMap.Marker({
          map: that.amapManager.getMap(),
          position: new AMap.LngLat(...position),
          animation: "AMAP_ANIMATION_DROP",
          offset: new AMap.Pixel(-15, -48),
          zindex: 103,
          icon: new AMap.Icon({
            size: new AMap.Size(31, 50),
            imageSize: new AMap.Size(31, 50),
            // image: that.vueImg,
            // imageOffset: new AMap.Pixel(-9, -3),
          }),
        });
      } else {
        console.log("看看中心点", this.clickMaker.getPosition());
        this.clickMaker.show();
        console.log(this.clickMaker);
        this.MAP.setCenter(new AMap.LngLat(...position));
        this.clickMaker.moveTo(new AMap.LngLat(...position), 36000);
      }
      if (needSearch) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          if (JSON.stringify(this.center) !== JSON.stringify(position)) {
            this.geocoderGetAddress(position);
          }
          that.searchNearLocal({
            keyWord: "",
            point: position,
            init: 1,
            from: "click",
          });
        }, 200);
      }
    },
    addCenterMarker(position) {
      console.log("原生中心定位");
      const that = this;
      if (!this.centerMaker) {
        this.centerMaker = new AMap.Marker({
          map: that.amapManager.getMap(),
          position: new AMap.LngLat(...position),
          // animation: 'AMAP_ANIMATION_DROP',
          zindex: 102,
          offset: new AMap.Pixel(-11, -11),
          icon: new AMap.Icon({
            size: new AMap.Size(23, 23),
            imageSize: new AMap.Size(23, 23),
            image: "https://webapi.amap.com/theme/v1.3/markers/b/loc.png",
            // imageOffset: new AMap.Pixel(-9, -3),
          }),
        });
      } else {
        // this.clickMaker.show();
        // console.log(this.clickMaker);
        this.centerMaker.moveTo(new AMap.LngLat(...position), 3600);
      }
    },
    listClick(item, index) {
      console.log("🚀 ~ file: AboutView.vue:707 ~ listClick ~ item:", item);
      let clickPos = item.position || item.location;
      this.selectedIndex = index;
      this.lastAddress = item;
      this.clickMaker.show();
      this.MAP.setCenter(clickPos);
      this.clickMaker.moveTo(clickPos, 3600);
    },
    cancelFn() {
      this.searchValue = "";
      this.listH = this.listPercentage;
      // if (this.cacheList.length > 0) {
      this.aroundList = this.cancelList;
      // }

      // window.document.querySelector(".amap-geo").click();
    },
    selectJudgment(item, index) {
      if (!item.formattedAddress && item.pname) {
        item.formattedAddress =
          item.pname + item.cityname + item.adname + item.address + item.name;
      } else if (!item.formattedAddress) {
        item.formattedAddress = item.address;
      }
      if (
        this.selectedIndex === index &&
        item.formattedAddress === this.lastAddress.formattedAddress
      ) {
        return true;
      }
      return false;
    },
    touchStart: function touchStart(event) {
      this.resetTouchStatus();
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    },
    touchMove: function touchMove(event) {
      // console.log(this.$refs.scrollBoxDom);
      const touch = event.touches[0]; // safari back will set clientX to negative number

      this.deltaX = touch.clientX < 0 ? 0 : touch.clientX - this.startX;
      this.deltaY = touch.clientY - this.startY;
      this.offsetX = Math.abs(this.deltaX);
      this.offsetY = Math.abs(this.deltaY);

      const LOCK_DIRECTION_DISTANCE = 10;

      if (
        !this.direction ||
        (this.offsetX < LOCK_DIRECTION_DISTANCE &&
          this.offsetY < LOCK_DIRECTION_DISTANCE)
      ) {
        this.direction = getDirection(this.offsetX, this.offsetY);
      }

      if (this.deltaY <= 0 && this.direction === "vertical") {
        // console.log("上");
        this.listH = 100 - this.listPercentage;
      } else if (
        this.deltaY > 0 &&
        this.direction === "vertical" &&
        this.$refs.scrollBoxDom.scrollTop < 1
      ) {
        // console.log("下");
        this.listH = this.listPercentage;
      }
    },
    resetTouchStatus: function resetTouchStatus() {
      this.direction = "";
      this.deltaX = 0;
      this.deltaY = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    },
    searchFocusFn() {
      this.listH = 100 - this.listPercentage;
      this.cancelBtnShow = true;
      this.clickMaker.hide();
      // this.cacheList=this.aroundList
      this.aroundList = [];
    },
    searchBlurFn() {
      // this.clickMaker.show();

      setTimeout(() => {
        if (!this.searchValue) {
          this.cancelBtnShow = false;
        }
      }, 100);
    },
  },
};
</script>

<style >
.likeWeChatMap .amap-marker {
  pointer-events: none;
}
</style>

<style lang="less">
.amap-logo,
.amap-copyright {
  /* display: none; */
  opacity: 0;
}
.header {
  font-family: PingFangSC-Regular;
  font-size: 16px;
  color: #ffffff;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.749), transparent);
  height: 80px;
  position: fixed;
  z-index: 999;
  top: 0;
  width: 100vw;
  padding-top: 40px;
  height: 45px;
  display: flex;
  justify-content: space-between;
  div {
    /* padding: 8px; */
    text-align: center;
    height: 30px;
    line-height: 30px;
    width: 54px;
    pointer-events: all;
    margin: 0 15px;
  }
  .back {
    color: #fff;
  }
  .done {
    background: #ff5601;
    border-radius: 4px;
  }
}
.dont {
  opacity: 0.3;
}
body {
  margin: 0;
  /* box-sizing: border-box; */
}
div {
  /* box-sizing: border-box; */
}

#listBox {
  padding-top: 46px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background: #ffffff;
  .mark {
    position: absolute;
    z-index: 10000;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    @keyframes rotate {
      0% {
        transform: rotate(360deg);
      }
      100% {
        transform: rotate(0deg);
      }
    }
    .rollImg {
      width: 30px;
      height: 30px;
      // background: url("~images/loading.png") no-repeat center center/30px;
      animation: rotate 1s linear infinite;
    }
  }
}
#listBox.moreBtn {
  padding-top: 96px;
}
.searchBar {
  background: #fff;
  position: absolute;
  top: 0;
  left: 0;
  text-align: left;
  width: 100vw;
  /* height: 45px; */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  &.noArrow {
    padding-top: 16px;
    // &::after{
    //   content: '';
    //   width: 100%;
    //   height:16px;
    //   position: absolute;
    //   top:-16px;
    //   left: 0;
    //   border-radius: 12px 12px 0 0;
    //   background: #fff;
    // }
  }
  .downArrow {
    width: 50px;
    height: 50px;
    // background: url("~images/downArrowForMap.png") no-repeat center center/25px;

    // font-size: 30px;
    // text-align: center;
    // line-height: 50px;
  }
  .inputDom {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    .searchWindow {
      margin: 0px 8px;
      // width: 100%;
      flex: 1;
      height: 34px;
      // background: #f7f7f7;
      border-radius: 17px;
      border: none;
      text-align: center;
      text-indent: -23px;
      // background: #f7f7f7 url("~images/search.png") no-repeat 145px center/14px;
      padding-left: 34px;
      caret-color: #ff5601;
      &.noRightMargin {
        margin-right: 0;
        // background: #f7f7f7 url("~images/search.png") no-repeat 16px center/14px;
        text-indent: 0px;
        text-align: left;
      }
      &::-webkit-search-decoration {
        display: none;
      }
    }
    input[type="search"]::-webkit-search-cancel-button {
      display: none;
    }

    input[type="search"]::-webkit-input-placeholder {
      position: relative;
      font-family: PingFangSC-Regular;
      font-size: 12px;
      color: #999999;
    }
    .cancelBtn {
      white-space: nowrap;
      font-family: PingFangSC-Regular;
      font-size: 15px;
      color: #1f52f9;
      width: 50px;
      padding: 8px;
    }
  }
}

.scrollBox {
  overflow: scroll;
  position: relative;
  height: 100%;

  .listItem {
    position: relative;
    height: 77px;
    border-bottom: 1px #eee solid;
    padding: 12px 0 0 16px;
    padding-right: 30px;
    .name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: #000000;
      font-size: 16px;
    }
    .greenName {
      color: #ff5601;
    }
    .dAndA {
      margin-top: 4px;
      font-size: 14px;
      color: #999999;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .myPosition {
      font-size: 14px;
      color: #666666;
      margin-bottom: 4px;
    }
    .selected {
      position: absolute;
      width: 18px;
      height: 18px;
      color: orangered;
      right: 8px;
      top: calc(50% - 9px);
      // background: url("~images/mapSelected.png") no-repeat center center / 18px;
    }
  }
  .empty {
    width: 100%;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    // background: url("~images/newEmpty.png") no-repeat center 47px;
    background-size: 130px;
    span {
      font-family: PingFangSC-Regular;
      font-size: 15px;
      color: #999;
      transform: translateY(37px);
    }
  }
  .tip {
    margin-top: 8px;
    font-size: 14px;
    color: #999999;
    text-align: center;
  }
}

/* @keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }

  to {
    background-position: 0 50%;
  }
}
body {
  background: linear-gradient(-45deg, #f1f2f3 25%, #ffffff 45%, #f1f2f3 65%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
} */
</style>
<!-- [
    {
        "id": "B0FFF4N4QE",
        "name": "信息科技中心",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.508033,
            "R": 114.04573700000003,
            "lng": 114.045737,
            "lat": 22.508033
        },
        "address": "市花路16号",
        "tel": "",
        "distance": 48,
        "shopinfo": "0",
        "toCenterDistance": 48.404689396374486
    },
    {
        "id": "B0FFL1RU1M",
        "name": "广东信息科技中心深发展信息科技大楼",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.507815,
            "R": 114.04581400000001,
            "lng": 114.045814,
            "lat": 22.507815
        },
        "address": "市花路与平冠道交叉口西北80米",
        "tel": "",
        "distance": 51,
        "shopinfo": "0",
        "toCenterDistance": 51.316004048558796
    },
    {
        "id": "B02F37VH5Q",
        "name": "深福保盈福大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.507705,
            "R": 114.047189,
            "lng": 114.047189,
            "lat": 22.507705
        },
        "address": "福田保税区市花路14号",
        "tel": "",
        "distance": 110,
        "shopinfo": "0",
        "toCenterDistance": 110.97925692644071
    },
    {
        "id": "B02F37VXS2",
        "name": "港安大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.507024,
            "R": 114.045819,
            "lng": 114.045819,
            "lat": 22.507024
        },
        "address": "市花路19号",
        "tel": "0755-82739555;0755-83485678",
        "distance": 126,
        "shopinfo": "0",
        "toCenterDistance": 126.69234525266465
    },
    {
        "id": "B0FFG722V6",
        "name": "深圳国际文化产业园",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.50691,
            "R": 114.04510099999999,
            "lng": 114.045101,
            "lat": 22.50691
        },
        "address": "市花路21号",
        "tel": "13714688745",
        "distance": 174,
        "shopinfo": "0",
        "toCenterDistance": 174.707911550463
    },
    {
        "id": "B02F38P5X8",
        "name": "富林物流大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.506904,
            "R": 114.04510099999999,
            "lng": 114.045101,
            "lat": 22.506904
        },
        "address": "市花路21号",
        "tel": "13714688745",
        "distance": 175,
        "shopinfo": "0",
        "toCenterDistance": 175.21742660292406
    },
    {
        "id": "B02F38NHE4",
        "name": "红树福苑",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.509569,
            "R": 114.04548,
            "lng": 114.04548,
            "lat": 22.509569
        },
        "address": "桂花路西段21号",
        "tel": "",
        "distance": 178,
        "shopinfo": "0",
        "toCenterDistance": 178.94499305302634
    },
    {
        "id": "B02F37U2J5",
        "name": "正佳物流大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.5083,
            "R": 114.044353,
            "lng": 114.044353,
            "lat": 22.5083
        },
        "address": "市花路18号",
        "tel": "0755-83482996",
        "distance": 191,
        "shopinfo": "0",
        "toCenterDistance": 191.27084591167633
    },
    {
        "id": "B0FFFXHSX1",
        "name": "深福保科技园",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.506464,
            "R": 114.04692599999998,
            "lng": 114.046926,
            "lat": 22.506464
        },
        "address": "黄槐道3号",
        "tel": "",
        "distance": 197,
        "shopinfo": "0",
        "toCenterDistance": 197.4082898136941
    },
    {
        "id": "B0JB31E4V4",
        "name": "长青阁",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.509962,
            "R": 114.04668500000002,
            "lng": 114.046685,
            "lat": 22.509962
        },
        "address": "平冠道与桂花路交叉口西南40米",
        "tel": "",
        "distance": 212,
        "shopinfo": "0",
        "toCenterDistance": 212.5199590351506
    },
    {
        "id": "B0JB31MQ22",
        "name": "红树福苑-1-4栋小区",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.509653,
            "R": 114.04482100000001,
            "lng": 114.044821,
            "lat": 22.509653
        },
        "address": "广兰道与绒花路交叉口西北100米",
        "tel": "",
        "distance": 223,
        "shopinfo": "0",
        "toCenterDistance": 223.15344493143607
    },
    {
        "id": "B0HAU4PMCS",
        "name": "创越大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.506647,
            "R": 114.04461800000001,
            "lng": 114.044618,
            "lat": 22.506647
        },
        "address": "广兰道与金花路交叉口东北40米",
        "tel": "",
        "distance": 229,
        "shopinfo": "0",
        "toCenterDistance": 229.95930718387083
    },
    {
        "id": "B02F37WQXX",
        "name": "福保桂花苑",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.509092,
            "R": 114.04830600000003,
            "lng": 114.048306,
            "lat": 22.509092
        },
        "address": "桂花路19号",
        "tel": "",
        "distance": 242,
        "shopinfo": "0",
        "toCenterDistance": 242.71330211171528
    },
    {
        "id": "B0IB27RYXR",
        "name": "纳威人的幸福",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.508083,
            "R": 114.048586,
            "lng": 114.048586,
            "lat": 22.508083
        },
        "address": "石化大道512号",
        "tel": "",
        "distance": 245,
        "shopinfo": "0",
        "toCenterDistance": 245.28624140626118
    },
    {
        "id": "B0GUCH7Y27",
        "name": "深圳福田口岸保税区",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.510134,
            "R": 114.04506900000001,
            "lng": 114.045069,
            "lat": 22.510134
        },
        "address": "桂花路与广兰道交叉口西南60米",
        "tel": "",
        "distance": 254,
        "shopinfo": "0",
        "toCenterDistance": 254.00373915169502
    },
    {
        "id": "B0FFHLK7IS",
        "name": "深装总A",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.505802,
            "R": 114.04571900000002,
            "lng": 114.045719,
            "lat": 22.505802
        },
        "address": "金花路与平冠道交叉口西南40米",
        "tel": "",
        "distance": 261,
        "shopinfo": "0",
        "toCenterDistance": 261.2262401725332
    },
    {
        "id": "B0FFLG3R43",
        "name": "福田保税区",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.509163,
            "R": 114.04384500000003,
            "lng": 114.043845,
            "lat": 22.509163
        },
        "address": "保税区鑫瑞科科技大厦",
        "tel": "",
        "distance": 269,
        "shopinfo": "0",
        "toCenterDistance": 269.3496211304642
    },
    {
        "id": "B0FFH4SXZQ",
        "name": "深装总创意设计园",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.505678,
            "R": 114.04515400000003,
            "lng": 114.045154,
            "lat": 22.505678
        },
        "address": "广兰道6号",
        "tel": "",
        "distance": 290,
        "shopinfo": "0",
        "toCenterDistance": 290.9416178739266
    },
    {
        "id": "B0FFG1BFYG",
        "name": "深装总大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.505672,
            "R": 114.04515400000003,
            "lng": 114.045154,
            "lat": 22.505672
        },
        "address": "广兰道6号",
        "tel": "",
        "distance": 291,
        "shopinfo": "0",
        "toCenterDistance": 291.5622107944384
    },
    {
        "id": "B0HD0ZYTDG",
        "name": "中信城开·红树湾(建设中)",
        "type": "商务住宅;住宅区;住宅小区",
        "location": {
            "Q": 22.509484,
            "R": 114.04339299999998,
            "lng": 114.043393,
            "lat": 22.509484
        },
        "address": "红树林公园东侧·红花道与香樟道交汇处",
        "tel": "",
        "distance": 326,
        "shopinfo": "1",
        "toCenterDistance": 326.9872470669914
    },
    {
        "id": "B02F37UERJ",
        "name": "九策科技园",
        "type": "商务住宅;产业园区;产业园区",
        "location": {
            "Q": 22.504798,
            "R": 114.046584,
            "lng": 114.046584,
            "lat": 22.504798
        },
        "address": "福田保税区黄槐道一号",
        "tel": "",
        "distance": 370,
        "shopinfo": "0",
        "toCenterDistance": 370.3453894522486
    },
    {
        "id": "B0FFH1YQV8",
        "name": "普洛斯中宝物流大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.504845,
            "R": 114.04497600000002,
            "lng": 114.044976,
            "lat": 22.504845
        },
        "address": "福田保税区桃花路28号",
        "tel": "",
        "distance": 384,
        "shopinfo": "0",
        "toCenterDistance": 384.25167935432717
    },
    {
        "id": "B0FFGC4JKJ",
        "name": "福田区银东大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.50746,
            "R": 114.04246,
            "lng": 114.04246,
            "lat": 22.50746
        },
        "address": "福田保税区市花路25号",
        "tel": "",
        "distance": 391,
        "shopinfo": "0",
        "toCenterDistance": 391.38767736591274
    },
    {
        "id": "B0FFFWU3LK",
        "name": "利保义生物工程大厦",
        "type": "商务住宅;楼宇;商务写字楼",
        "location": {
            "Q": 22.507454,
            "R": 114.04245400000002,
            "lng": 114.042454,
            "lat": 22.507454
        },
        "address": "市花路25号",
        "tel": "",
        "distance": 392,
        "shopinfo": "0",
        "toCenterDistance": 392.11733171513623
    },
    {
        "id": "B0IASUKWIH",
        "name": "自由港湾公寓A栋重建工程生活区",
        "type": "商务住宅;商务住宅相关;商务住宅相关",
        "location": {
            "Q": 22.509864,
            "R": 114.04952600000001,
            "lng": 114.049526,
            "lat": 22.509864
        },
        "address": "桂花路与凤凰道交叉口西北20米",
        "tel": "",
        "distance": 393,
        "shopinfo": "0",
        "toCenterDistance": 393.9814237778744
    }
] -->