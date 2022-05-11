<template>

  <div class="map-wrap">

    <ol-map :mapCreator="mapCreator" @mapReady="handleMapReady"/>

    <div class="tool-wrap">
      <input type="range" step="1" min="0" :max="player.max()" :value="player.index()" v-on:input="handleIndexChanged" />
      <button @click="handleSearch">查询</button>
      <button @click="handleSpeedDown">速度-</button>
      <button @click="player.backward()">后退</button>
      <button v-if="player.playing()" @click="player.pause()">暂停</button>
      <button v-else @click="player.play()">播放</button>
      <button @click="player.forward()">前进</button>


      <button @click="handleSpeedUp">速度+</button>
      <span>当前速度: {{speed}}</span>
      <span v-if="attributes">当前时间: {{attributes.reportTime}}, {{attributes.lng}}, {{attributes.lat}}</span>
    </div>

  </div>

</template>

<script>

  import moment from 'dayjs';

  import 'ol/ol.css';
  import {Map, View} from 'ol';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';

  import OlMap from "../../map/OlMap";
  import TrackPlayerFeatureManagerFactory from "./TrackPlayerFeatureManagerFactory";
  import TrackPlayer from "../../trackPlayer/TrackPlayer";
  import {TRACK_PLAYER_EVENT} from "../../Constants";

  const createTrackFunction = function (type, length = 200, segment = 1) {
    let lng = 115.7751290590016, lat = 40.304671723555804, reportTime = moment();
    const t = [];
    const base = type === 'vehicle' ? {
      vehicleNo: '赣A12345',
      driver: '李四',
      identityNumber: 'xxxxxx',
      contact: '18910123001',
      orgName: '江西航天鄱湖云'
    } : {
      name: '张三',
      sexName: '男',
      jobName: 'java工程师',
      identityNumber: 'xxxxxx',
      contact: '18910123001',
      orgName: '江西航天鄱湖云'
    }
    for(let i = 0; i < segment; i++) {
      const p = [];
      for(let j = 0; j < length; j++) {
        let id = i * length + j;
        p.push(Object.assign({}, base, {
          id,
          reportTime: reportTime.add(id, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
          lng,
          lat
        }));
        lng += Math.random() * 0.00003 - 0.000012;
        lat += Math.random() * 0.00002 - 0.000009;
      }
      t.push(p);
      lng += 0.0003;
      lat += 0.0002;
    }
    return t;
  };

  export default {
    name: "Example",
    components: {OlMap},
    data() {
      return {
        player: TrackPlayer.emptyTrackPlayer(),
        speed: 15,
        attributes: undefined
      };
    },
    methods: {

      mapCreator(target) {
        return new Map({
          target,
          layers: [
            new TileLayer({
              source: new OSM()
            })
          ],
          view: new View({
            projection: 'EPSG:4326',
            center: [115.7771390590016, 40.305671723555804],
            zoom: 10
          }),
          controls: [

          ]
        });
      },

      handleMapReady(featureManagerPool) {

        const fm = TrackPlayerFeatureManagerFactory.create();
        featureManagerPool.add(fm).getInfoWindowManager().once('VEHICLE_ROLL_CALL,VEHICLE_SEND_MESSAGE', ({data}) => {
          alert('VEHICLE_SEND_MESSAGE：' + data.vehicleNo);
        }).on('VEHICLE_ROLL_CALL', ({data}) => {
          alert('VEHICLE_ROLL_CALL：' + data.vehicleNo);
        });

        //这里演示轨迹线流动效果
        let timer;
        let player = TrackPlayer.newInstance(fm).on(TRACK_PLAYER_EVENT.TRACK_CHANGED, e => {
          let {trackLineFeature} = e.data;
          timer && clearInterval(timer);
          timer = this._startLineDashOffsetInterval(trackLineFeature);
        });

        this.player = player;

      },

      handleIndexChanged(e) {
        this.player.setIndex(e.target.value * 1);
      },

      handleSearch() {
        let type = Math.random() > 0.5 ? 'person' : 'vehicle';
        this.player.setTrack({
          type,
          track: createTrackFunction(type, 200, 10),
          step: 10
        });
      },

      handleSpeedUp() {
        let {speed} = this;
        this._setSpeed(++speed);
      },

      handleSpeedDown() {
        let {speed} = this;
        this._setSpeed(--speed);
      },

      _setSpeed(speed) {
        if(speed <= 0 || speed > 20) {
          return;
        }
        this.speed = speed;
        this.player.setInterval(630 - 30 * speed);
      },

      _startLineDashOffsetInterval(feature) {
        feature.set('lineDashOffset', 0);
        return setInterval(function () {
          let lineDashOffset = feature.get('lineDashOffset');
          lineDashOffset = lineDashOffset === 0 ? 8 : lineDashOffset - 1;
          feature.set('lineDashOffset', lineDashOffset);
        }, 200);
      }

    }
  }

</script>

<style scoped lang="less">
  .map-wrap {
    width: 100%;
    height: 100%;
    .tool-wrap {
      position: absolute;
      padding: 10px;
      top: 20px;
      left: 60px;
      background: #8bc34a;
      input {
        width: 700px;
      }
    }
  }
</style>
