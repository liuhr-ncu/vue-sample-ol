<template>
  <div class="info-window-wrap">
    <div class="info-window-title">
      <div>
        <slot name="title">弹窗标题</slot>
      </div>
      <a class="info-window-close" @click="handleCloseInfoWindow"></a>
    </div>
    <div class="info-window-content">
      <slot name="content">弹窗内容</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfoWindowTemplate',
  methods: {
    handleCloseInfoWindow () {
      this.$parent.$emit('close');
    }
  }
};
</script>

<style scoped>
.info-window-wrap {
  position: relative;
  box-shadow: -1px 0px 12px 0px #3c8dbc;
  width: -moz-max-content;
  width: max-content;
  min-width: 240px;
}

.info-window-wrap::before {
  content: "";
  position: absolute;
  z-index: -20;
  border-right: 1px solid #3a83bd;
  border-bottom: 2px solid #3a83bd;
  left: calc(50% + 10px);
  bottom: -22px;
  width: 15px;
  height: 40px;
  transform: rotate(60deg) skew(0deg, 50deg);
  background: #ffffff;
}

.info-window-title {
  background: #ff9800;
  padding: 8px 10px;
  color: white;
  height: 24px;
}
.info-window-title>div {
  display: inline-block;
  height: 100%;
}

.info-window-content {
  background: white;
  min-height: 120px;
}

.info-window-close {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  background: url("./img/close.png") center no-repeat;
  background-size: 100% 100%;
  cursor: pointer;
}
.info-window-close:hover {
  background-image: url("./img/close-hover.png");
}

</style>
