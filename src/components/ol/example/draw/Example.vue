<template>

  <div class="map-wrap">

    <ol-map :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    <div class="tool-wrap">
      <select @change="drawKeyChangeHandler">
        <option value="false">关闭绘制</option>
        <option value="POINT">绘制点</option>
        <option value="LINE">绘制线</option>
        <option value="RECTANGLE">绘制矩形</option>
        <option value="SQUARE">绘制正方形</option>
        <option value="CIRCLE">绘制圆</option>
        <option value="POLYGON">绘制多边形</option>
      </select>
      <input type="checkbox" checked @click="handleClearHistoryClick"/> 清除历史绘制
      <input type="checkbox" checked @click="handleModifyClick"/> 开启编辑
      <input type="checkbox" checked @click="handleMeasureClick"/> 开启量测
    </div>

  </div>

</template>

<script>

  import 'ol/ol.css';
  import {Map, View} from 'ol';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';

  import OlMap from "../../map/OlMap";
  import DrawManager from "../../draw/DrawManager";



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
        let map = featureManagerPool.getMap();
        const drawManager = DrawManager.newInstance().active(map);
        this.drawManager = drawManager;
      },

      drawKeyChangeHandler(e) {
        this.drawManager.draw(e.target.value);
      },

      handleClearHistoryClick(e) {
        this.drawManager.clearHistory(e.target.checked);
      },

      handleModifyClick(e) {
        this.drawManager.modify(e.target.checked);
      },

      handleMeasureClick(e) {
        this.drawManager.measure(e.target.checked);
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
    }
  }
</style>
