<template>
  <div class="map-wrap">
    <div class='map'  id='map'></div>
    <info-window :manager="manager"></info-window>
  </div>
</template>

<script>
import InfoWindow from '@/components/ol/InfoWindow';
import InfoWindowManager from '@/components/ol/InfoWindowManager';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
// import TileArcGISRest from "ol/source/TileArcGISRest";
import FeatureManagerFactory from './feature/FeatureManagerFactory';
import {OSM} from 'ol/source';
import FeatureManagerPool from '@/components/ol/FeatureManagerPool';
import FeatureManager from "@/components/ol/FeatureManager";

const features = {
  person: [{
    id: 1,
    name: '张三',
    lng: 114.064839,
    lat: 22.648857,
    alarm: true,
    online: false
  }, {
    id: 2,
    name: '李四',
    lng: 114.068839,
    lat: 22.658857,
    alarm: false,
    online: true
  }],
  plat: [{
    id: 1,
    name: '平台A',
    lng: 114.034839,
    lat: 22.668857,
    alarm: true,
    online: true
  }, {
    id: 2,
    name: '平台B',
    lng: 114.038839,
    lat: 22.658857,
    alarm: false,
    online: false
  }],
  ship: [{
    id: 1,
    name: '船舶A',
    lng: 114.044839,
    lat: 22.648857,
    alarm: true,
    online: true
  }, {
    id: 2,
    name: '船舶B',
    lng: 114.048839,
    lat: 22.658857,
    alarm: false,
    online: true
  }]
}

export default {
  name: 'Map',
  components: {InfoWindow},
  data () {
    return {
      map: undefined,
      manager: undefined,
      events: {
        'infoWindow.open': ({data}) => {
          alert("打开弹窗:" + data.open.get('attributes')._type)
        },
        'infoWindow.close': ({data}) => {
          alert("关闭弹窗:" + data.get('attributes')._type)
        },
        'person.click': ({data}) => {
          alert("单击人员:" + data.name)
        },
        'plat.click': ({data}) => {
          alert("单击平台:" + data.name)
        },
        'ship.click': ({data}) => {
          alert("单击船舶:" + data.name)
        }
      }
    };
  },
  mounted () {
    console.log('map mounted');
    //初始化地图
    this._initMap();
    //初始化弹窗Manager
    this._initManager();
    //初始化要素Manager
    this._initFeatureManagers();
    //初始化要素
    this._initFeatures();
    //模拟要素运动
    this._startRun();
  },
  methods: {

    _initMap () {
      this.map = new Map({
        target: 'map',
        layers: [new TileLayer({
          source: new OSM()/* new TileArcGISRest({
            url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer'
          }) */
        })],
        view: new View({
          projection: 'EPSG:4326',
          center: [114.048839, 22.658857],
          zoom: 15
        })
      });
    },

    _initManager () {
      let {map, events} = this;
      let featureManagerPool = FeatureManagerPool.newInstance(map);
      this.manager = InfoWindowManager.newInstance(featureManagerPool, events);
    },

    _initFeatureManagers () {
      let {manager} = this;
      let featureManagerPool = manager.getFeatureManagerPool();
      let personFeatureManager = FeatureManagerFactory.create('person', manager);
      let platFeatureManager = FeatureManagerFactory.create('plat', manager);
      let shipFeatureManager = FeatureManagerFactory.create('ship', manager);
      //聚合测试
      let clusterPersonAndPlatFeatureManager = FeatureManager.cluster({
        type: 'person_plat_cluster',
        classify: ({name}) => {
          return name.indexOf('平台') > -1 ? 'plat' : 'person';
        }
      }, personFeatureManager, platFeatureManager);

      featureManagerPool.add(clusterPersonAndPlatFeatureManager).add(shipFeatureManager);
    },

    _initFeatures () {
      let {manager} = this, {person, plat, ship} = features;
      let featureManagerPool = manager.getFeatureManagerPool();
      let clusterPersonAndPlatFeatureManager = featureManagerPool.get('person_plat_cluster');
      //let platFeatureManager = featureManagerPool.get('plat');
      let shipFeatureManager = featureManagerPool.get('ship');

      clusterPersonAndPlatFeatureManager.addFeatures([...person, ...plat]);
      //platFeatureManager.addFeatures(plat);
      shipFeatureManager.addFeatures(ship);
    },

    _startRun() {
      setInterval(() => {
        let {person, plat, ship} = features, all = [...person, ...plat,  ...ship];
        //修改经纬度
        all.forEach(item => {
          let {lng, lat, alarm, online} = item;
          lng += Math.random() * 0.00001;
          lat += Math.random() * 0.000005;
          //alarm = !alarm;
          //online = !online;
          Object.assign(item, {lng, lat, alarm, online});
        });
        //! 这里更新位置
        this._initFeatures();
      }, 50);
    }

  }
};
</script>

<style scoped>
.map-wrap,
.map{
  width: 100%;
  height: 100%;
}
</style>
