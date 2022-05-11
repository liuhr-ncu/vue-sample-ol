<template>
  <div>
    <keep-alive>
      <component :is="template" :positioning="positioning" :attributes="attributes"
                 @dispatch="handleDispatchEvent" @close="handleInfoWindowClose"/>
    </keep-alive>
  </div>
</template>

<script>

  import OLUtils from "../OLUtils";
  import InfoWindowManager from "./InfoWindowManager";
  import {FEATURE_KEY} from "../Constants";

  export default {
    name: "infoWindowComponent",
    props: {
      infoWindowManager: InfoWindowManager
    },
    data() {
      return {
        template: undefined,
        positioning: undefined,
        attributes: undefined
      };
    },
    methods: {

      handleDispatchEvent(type, data) {
        this.infoWindowManager.dispatch(type, data);
      },

      handleInfoWindowClose() {
        this.infoWindowManager.close();
      },

      _activeFeatureChanged(now, old) {
        if(now) {
          let {infoWindowManager} = this;
          let infoWindow = infoWindowManager.getInfoWindow();

          this.template = infoWindow.template();
          this.positioning = infoWindow.positioning();
          this.attributes = now.get(FEATURE_KEY.ATTRIBUTES);
        }
        setTimeout(() => {
          old && old.unset(FEATURE_KEY.ACTIVE);
          now && now.set(FEATURE_KEY.ACTIVE, true);
        });
      },

      _activeFeatureGeometryChanged(geometry) {
        let position = geometry ? OLUtils.getGeometryCenter(geometry) : undefined;
        let {infoWindowManager} = this;
        setTimeout(() => {
          infoWindowManager && infoWindowManager.setInfoWindowPosition(position);
        });
      },

      _activeFeatureAttributesChanged(attributes) {
        this.attributes = attributes;
      }

    },
    watch: {
      infoWindowManager: {
        handler(infoWindowManager) {
          infoWindowManager && infoWindowManager.active(this.$el);
        },
        immediate: true
      },
      'infoWindowManager._feature': function(now, old) {
        this._activeFeatureChanged(now, old);
      },
      'infoWindowManager._feature.values_.geometry': function(geometry){
        this._activeFeatureGeometryChanged(geometry);
      },
      'infoWindowManager._feature.values_.attributes': function(attributes) {
        this._activeFeatureAttributesChanged(attributes);
      }
    }
  }
</script>