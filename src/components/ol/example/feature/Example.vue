<template>

  <div class="map-wrap">

    <ol-map :mapCreator="mapCreator" @mapReady="handleMapReady"/>

  </div>

</template>

<script>

  import moment from 'dayjs';

  import 'ol/ol.css';
  import {Map, View} from 'ol';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';


  import OlMap from "../../map/OlMap";
  import {FeatureType, FeatureManagerFactory} from "./FeatureManagerFactory";

  export default {
    name: "Example",
    components: {OlMap},
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

        const cfm = FeatureManagerFactory.create(FeatureType.COMPOSE, false);
        featureManagerPool.add(cfm).getInfoWindowManager().once('VEHICLE_ROLL_CALL,VEHICLE_SEND_MESSAGE', ({data}) => {
          alert('VEHICLE_SEND_MESSAGE：' + data.vehicleNo);
        }).on('VEHICLE_ROLL_CALL', ({data}) => {
          alert('VEHICLE_ROLL_CALL：' + data.vehicleNo);
        }).on('PERSON_SEND_MESSAGE', ({data}) => {
          alert('PERSON_SEND_MESSAGE：' + data.name);
        }).on('PERSON_ROLL_CALL', ({data}) => {
          alert('PERSON_ROLL_CALL：' + data.name);
        });

        this.featureManager = cfm;
        let features = this._initFeatures(2, 2);
        //this._running(features);
      },

      _initFeatures(personNumber, vehicleNumber) {
        let features = [];
        while (personNumber-- > 0) {
          features.push({
            id: personNumber,
            name: '张三' + personNumber,
            sexName: '男',
            jobName: 'java工程师',
            identityNumber: 'xxxxxx',
            contact: '18910123001',
            orgName: '江西航天鄱湖云',
            reportTime: '2022-02-10 16:02:00',
            lng: 115.7771390590016 + Math.random() * 0.00024 * personNumber,
            lat: 40.305671723555804 + Math.random() * 0.00018 * personNumber,
            isAlarm: Math.random() > 0.5 ? 1 : 0,
            online: Math.random() > 0.5 ? 1 : 0
          });
        }
        while (vehicleNumber-- > 0) {
          features.push({
            id: vehicleNumber,
            vehicleNo: '赣A' + (13000 + vehicleNumber),
            driver: '李四' + vehicleNumber,
            identityNumber: 'xxxxxx',
            contact: '18910123001',
            orgName: '江西航天鄱湖云',
            reportTime: '2022-02-10 16:02:00',
            lng: 115.7761390590016 + Math.random() * 0.00012 * vehicleNumber,
            lat: 40.305871723555804 + Math.random() * 0.00009 * vehicleNumber,
            isAlarm: Math.random() > 0.5 ? 1 : 0,
            online: Math.random() > 0.5 ? 1 : 0
          });
        }
        this.featureManager.addFeature(features);
        return features;
      },

      _running(features) {
        let {featureManager} = this;
        features = features.filter(f => f.id % 10 === 0);
        let _setInterval = (f, time) => {
          let g = () => {
            f();
            setTimeout(g, time);
          };
          setTimeout(g, time);
        };
        features.forEach(feature => {
          (function (f) {
            _setInterval(() => {

              let reportTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
              let {lng, lat} = f;
              lng += Math.random() * 0.00003 - 0.000012;
              lat += Math.random() * 0.00002 - 0.000009;
              let isAlarm = Math.random() > 0.5 ? 1 : 0;
              let online = Math.random() > 0.5 ? 1 : 0;
              f = Object.assign({}, f, {lng, lat, isAlarm, online, reportTime});
              featureManager.updateFeature(f);

            }, 2000);
          })(feature);
        });
      }

    }
  }

</script>

<style scoped lang="less">
  .map-wrap {
    width: 100%;
    height: 100%;
  }
</style>
