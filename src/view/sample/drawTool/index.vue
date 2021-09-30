<template>
  <div class="map-wrap">
    <div class='map'  id='map'></div>
    <div class="tool-wrap">
      <select @change="drawKeyChangeHandler">
        <option value="point">点</option>
        <option value="lineString">线</option>
        <option value="rectangle">矩形</option>
        <option value="square">正方形</option>
        <option value="circle">圆形</option>
        <option value="polygon">多边形</option>
      </select>
      <input type="checkbox" checked @click="handleClearPreviousClick">清除上次绘制
      <input type="checkbox" checked @click="handleModifyClick">开启编辑
      <input type="checkbox" checked @click="handleMeasureClick">开启测量
    </div>
  </div>
</template>

<script>

import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';

import {DrawTool} from '@/components/ol/DrawTool';

import {OSM} from 'ol/source';


export default {
  name: 'Map',
  data () {
    return {
      map: undefined,
      drawTool: undefined
    };
  },
  mounted () {
    console.log('map mounted');
    //初始化地图
    this._initMap();
    //初始轨迹播放器
    this._initDrawTool();
  },
  methods: {
    drawKeyChangeHandler(e) {
      this.drawTool.enableDraw(e.target.value);
    },
    handleClearPreviousClick(e){
      e.target.checked ? this.drawTool.clearPrevious() : this.drawTool.keepPrevious();
    },
    handleModifyClick(e) {
      e.target.checked ? this.drawTool.enableModify() : this.drawTool.disableModify();
    },
    handleMeasureClick(e) {
      e.target.checked ? this.drawTool.enableMeasure() : this.drawTool.disableMeasure();
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

    _initDrawTool() {
      this.drawTool = DrawTool.newInstance().usedTo(this.map);
      this.drawTool.enableDraw('point');
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
.tool-wrap {
  position: absolute;
  padding: 10px;
  top: 20px;
  left: 60px;
  background: #8bc34a;
}
</style>
