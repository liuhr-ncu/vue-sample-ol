<template>
  <div class="map-wrap-container">
    <div class="map-wrap">
      <ol-map mapId="map1" :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    </div>
    <div class="map-wrap">
      <ol-map mapId="map2" :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    </div>
    <div class="map-wrap">
      <ol-map mapId="map3" :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    </div>
    <div class="map-wrap">
      <ol-map mapId="map4" :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    </div>
  </div>
</template>

<script>

  import 'ol/ol.css';
  import {Map, View} from 'ol';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';


  import OlMap from "../../map/OlMap";

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
          controls: []
        });
      },

      handleMapReady(featureManagerPool) {
        let {views} = this, view = featureManagerPool.getMap().getView();
        views.push(view);

        view.on("change",  e => {

          let targetView = e.target;
          let center = targetView.getCenter();
          let rotation = targetView.getRotation();
          let resolution = targetView.getResolution();

          views.forEach(_view => {
            if (_view === targetView) {
              return;
            }
            _view.setCenter(center);
            _view.setRotation(rotation);
            _view.setResolution(resolution);
          });

        });
      }

    },
    created() {
      this.views = [];
    }
  }
</script>

<style scoped lang="less">
.map-wrap-container {
  width: 100%;
  height: 100%;

  .map-wrap {
    width: 50%;
    height: 50%;
    float: left;
  }
}
</style>
