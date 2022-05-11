<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <info-window-template :styleOptions="styleOptions">

    <template v-slot:title><span>{{attributes.vehicleNo}}</span></template>

    <template v-slot:content>
      <div class="attributes-info-wrap">
        <div>
          <div :span="12"><span>车牌号：</span><span>{{attributes.vehicleNo}}</span></div>
          <div :span="12"><span>驾驶员：</span><span>{{attributes.driver}}</span></div>
        </div>
        <div>
          <div :span="12"><span>身份证号：</span><span>{{attributes.identityNumber}}</span></div>
          <div :span="12"><span>联系方式：</span><span>{{attributes.contact}}</span></div>
        </div>
        <div>
          <div :span="24"><span>所属单位：</span><span>{{attributes.orgName}}</span></div>
        </div>
        <div>
          <div :span="24"><span>位置信息：</span><span style="color: red">{{lonLatFormatValue}}</span></div>
        </div>
        <div>
          <div :span="24"><span>最终定位时间：</span><span>{{attributes.reportTime}}</span></div>
        </div>
      </div>
      <div class="info-window-btn-group">
        <div @click="dispatch('VEHICLE_SEND_MESSAGE', attributes)">短报文</div>
        <div @click="dispatch('VEHICLE_ROLL_CALL', attributes)">点名</div>
      </div>
    </template>

  </info-window-template>
</template>

<script>

  import InfoWindowTemplate from "../../infoWindow/InfoWindowTemplate";
  import {InfoWindowMixin} from "../../infoWindow/InfoWindowMixin";
  import GeoUtils from "../../GeoUtils";

  export default {
    name: 'VehicleInfoWindow',
    mixins: [InfoWindowMixin],
    components: {InfoWindowTemplate},
    data() {
      return {
        styleOptions: {
          square: {
            crossingAngle: '60deg',
            background: '#faad14'
          }
        }
      }
    },
    computed: {
      lonLatFormatValue() {
        let {lng, lat} = this.attributes;
        return GeoUtils.formatLonLat([lng, lat]).join(', ');
      }
    }
  }

</script>

<style scoped>
  .attributes-info-wrap {
    padding: 15px;
    width: 480px;
  }
  .info-window-btn-group {
    width: 100%;
  }
  .info-window-btn-group>div {
    display: inline-block;
    width: 50%;
    height: 100%;
    text-align: center;
    padding: 12px;
    background: #faad14;
    color: white;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 2px;
    cursor: pointer;
  }
  .info-window-btn-group>div:first-child {
    border-bottom-left-radius: 5px;
  }
  .info-window-btn-group>div:last-child {
    border-bottom-right-radius: 5px;
  }
  .info-window-btn-group>div:hover {
    background: #fb964c;
    color: white;
  }
  .attributes-info-wrap .ant-row {
    padding: 5px;
  }
</style>
