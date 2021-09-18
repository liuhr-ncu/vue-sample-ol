<template>
  <div class="map-wrap">
    <div class='map'  id='map'></div>
  </div>
</template>

<script>

import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';

import FeatureManagerFactory from './feature/FeatureManagerFactory';
import {OSM} from 'ol/source';
import FeatureManagerPool from '@/components/ol/FeatureManagerPool';
import HistoryTrackPlayer from "@/components/ol/HistoryTrackPlayer";


const track = [
  [{
    id: 1,
    name: '张三',
    lng: 114.064839,
    lat: 22.648857,
    createTime: '2021-09-01 10:00:00'
  }, {
    id: 2,
    name: '张三',
    lng: 114.068839,
    lat: 22.658857,
    createTime: '2021-09-01 10:10:00'
  }, {
    id: 3,
    name: '张三',
    lng: 114.034839,
    lat: 22.668857,
    createTime: '2021-09-01 10:20:00'
  }],[{
    id: 4,
    name: '张三',
    lng: 114.038839,
    lat: 22.658857,
    createTime: '2021-09-01 10:30:00'
  }, {
    id: 5,
    name: '张三',
    lng: 114.044839,
    lat: 22.648857,
    createTime: '2021-09-01 10:40:00'
  }, {
    id: 6,
    name: '张三',
    lng: 114.048839,
    lat: 22.658857,
    createTime: '2021-09-01 10:50:00'
  }]
];

export default {
  name: 'Map',
  data () {
    return {
      map: undefined,
      player: undefined
    };
  },
  mounted () {
    console.log('map mounted');
    //初始化地图
    this._initMap();
    //初始轨迹播放器
    this._initPlayer();
    //模拟轨迹回放
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

    _initPlayer() {
      let {map} = this;
      let featureManagerPool = FeatureManagerPool.newInstance(map);
      let trackFeatureManager = FeatureManagerFactory.createTrackManager();
      let pointFeatureManager = FeatureManagerFactory.createPointManager();
      featureManagerPool.add(trackFeatureManager).add(pointFeatureManager);
      let historyTrackPlayer = new HistoryTrackPlayer({step: 0.0001, featureManagerPool});
      this.player = historyTrackPlayer;
    },

    _startRun() {
      this.player.setTrack(track).forwardPlay();
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
