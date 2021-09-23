<template>
  <info-window-template>
    <template v-slot:title>
      <span>{{attributes.name}}</span>
    </template>
    <template v-slot:content>
      <div>name: {{attributes.name}}</div>
      <div>lng: {{attributes.lng}}</div>
      <div>lat: {{attributes.lat}}</div>
      <div>createTime: {{attributes.createTime}}</div>
    </template>
  </info-window-template>
</template>

<script>

import InfoWindowTemplate from '@/components/ol/InfoWindowTemplate';
import {InfoWindowMixin} from '@/components/ol/InfoWindowMixin';

export default {
  name: 'InfoWindow',
  mixins: [InfoWindowMixin],
  components: {InfoWindowTemplate}
};
</script>

<style scoped>

</style>
