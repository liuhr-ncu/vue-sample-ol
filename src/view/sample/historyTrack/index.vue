<template>
  <div class="map-wrap">
    <div class='map'  id='map'></div>
    <info-window :manager="manager"></info-window>
    <div style="position: absolute;top: 20px;left: 90px;width: 700px;background: #9e9e9eed;padding: 8px;border-radius: 5px;">
      <input type="range" step="1" min="0" :max="playerLength" v-model="progress" v-on:input="progressChangeHandle" style="width: 700px"/>
      <button @click="speedUpHandle">速度+</button>
      <button v-if="playerStatus" @click="pauseHandle">暂停</button>
      <button v-else @click="playHandle">播放</button>
      <button @click="speedDownHandle">速度-</button>
      <span>当前速度: {{speed}}</span>
      <span v-if="attribute">当前时间: {{attribute.createTime}},  {{attribute.lng}},{{attribute.lat}}</span>
    </div>

  </div>
</template>

<script>

import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';

import InfoWindow from '@/components/ol/InfoWindow';
import InfoWindowManager from '@/components/ol/InfoWindowManager';

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
  components: {InfoWindow},
  data () {
    return {
      map: undefined,
      manager: undefined,
      player: undefined,
      progress: 0,
      attribute: undefined,
      speed: 15
    };
  },
  mounted () {
    console.log('map mounted');
    //初始化地图
    this._initMap();
    //初始轨迹播放器
    this._initPlayer();
    //设置轨迹
    this._setTrack();
  },
  methods: {

    speedUpHandle() {
      let {speed} = this;
      if (speed < 20) {
        speed += 1;
        this.speed = speed;
        this.player.setInterval(630 - 30 * speed);
      }
    },
    speedDownHandle() {
      let {speed} = this;
      if (speed > 1) {
        speed -= 1;
        this.speed = speed;
        this.player.setInterval(630 - 30 * speed);
      }
    },

    playHandle() {
      this.player.forwardPlay();
    },

    pauseHandle() {
      this.player.pause();
    },

    progressChangeHandle(e) {
      this.player.setIndex(e.target.value * 1);
    },

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
      let {map, speed} = this;

      let featureManagerPool = FeatureManagerPool.newInstance(map);
      let infoWindowManager = InfoWindowManager.newInstance(featureManagerPool);
      let trackFeatureManager = FeatureManagerFactory.createTrackManager();
      let pointFeatureManager = FeatureManagerFactory.createPointManager(infoWindowManager);
      featureManagerPool.add(trackFeatureManager).add(pointFeatureManager);
      let historyTrackPlayer = new HistoryTrackPlayer({step: 0.0001, interval: 630 - 30 * speed, featureManagerPool});
      this.manager = infoWindowManager;
      this.player = historyTrackPlayer;
    },

    _setTrack() {
      this.player.setTrack(track);
    }

  },

  computed: {

    playerLength() {
      return this.player ? this.player.length() - 1 : 0;
    },

    playerValue() {
      return this.player ? this.player.value() : undefined;
    },

    playerStatus() {
      return this.player ? this.player.playing() : false;
    }

  },

  watch: {
    playerValue(nowVal, oldVal) {
      this.progress = nowVal.index;
      this.attribute = nowVal.attribute;
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
