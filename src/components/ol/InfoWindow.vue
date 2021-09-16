<template>
  <div>
    <keep-alive>
      <component :is="template" :attributes="attributes" :manager="manager" :shared="shared" @close="manager.close()"/>
    </keep-alive>
  </div>
</template>

<script>

import InfoWindowManager from './InfoWindowManager';

export default {
  name: 'InfoWindow',
  props: {
    manager: InfoWindowManager,
    shared: Object
  },
  data () {
    return {
      template: undefined,
      attributes: undefined
    };
  },
  mounted () {
    console.log('infoWindow mounted');
  },
  methods: {

  },
  computed: {
    feature () {
      let {manager} = this;
      return manager ? manager.getFeature() : undefined;
    },
    position () {
      let {manager} = this;
      return manager ? manager.getPosition() : undefined;
    }
  },
  watch: {
    manager: {
      handler: function (manager) {
        manager && manager.init(this.$el);
      },
      immediate: true
    },
    feature (now, old) {
      old && old.set('opened', false);
      now && (
        now.set('opened', true),
        this.template = this.manager.getTemplate(),
        this.attributes = this.manager.getAttributes()
      );
    },
    position: {
      handler: function (position) {
        let {manager} = this;
        manager && manager.updateOverlayPosition(position);
      },
      deep: true
    }
  }

};
</script>

<style scoped>

</style>
