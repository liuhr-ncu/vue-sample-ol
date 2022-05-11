<template>
  <div :id="mapId" class="ol-map">
    <info-window-component :infoWindowManager="infoWindowManager" />
  </div>
</template>

<script>

  import 'ol/ol.css';
  import {Map, View} from 'ol';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';

  import InfoWindowComponent from "../infoWindow/InfoWindowComponent";
  import InfoWindowManager from "../infoWindow/InfoWindowManager";

  export default {
    components: {InfoWindowComponent},
    name: "olMap",
    props: {
      mapId: {
        type: String,
        default: 'map'
      },
      autoPan: {
        type: Boolean,
        default: true
      },
      mapCreator: {
        type: Function,
        default: function (target) {
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
              zoom: 12
            })
          });
        }
      }
    },
    data() {
      return {
        infoWindowManager: undefined
      };
    },
    methods: {
      _initComponent() {
        let {mapId, autoPan, mapCreator} = this, map = mapCreator.call(null, mapId);
        let infoWindowManager = InfoWindowManager.newInstance(map, autoPan);
        this.infoWindowManager = infoWindowManager;

        let featureManagerPool = infoWindowManager.getFeatureManagerPool();
        this.$emit('mapReady', featureManagerPool);
      }
    },
    mounted() {
      this._initComponent();
    }
  }

</script>

<style scoped>
  .ol-map {
    width: 100%;
    height: 100%;
  }
</style>