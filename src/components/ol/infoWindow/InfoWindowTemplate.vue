<template>

  <div class="info-window-wrap" :style="_styleOptions">
    <div class="info-window-border"></div>
    <div class="info-window-body">
      <div class="info-window-title-wrap">
        <div class="info-window-title">
          <slot name="title">弹窗标题</slot>
        </div>
        <a-icon class="info-window-close" type="close" @click="handleCloseInfoWindow"/>
      </div>
      <div class="info-window-content-wrap">
        <slot name="content">弹窗内容</slot>
      </div>
    </div>
  </div>

</template>


<script>

  import CssUtils from "../CssUtils";
  import {DEFAULT_INFO_WINDOW_TEMPLATE_STYLE_OPTIONS} from "../Constants";

  export default {
    name: "infoWindowTemplate",
    props: {
      styleOptions: {
        type: Object,
        default: () => {
          return DEFAULT_INFO_WINDOW_TEMPLATE_STYLE_OPTIONS;
        }
      }
    },
    methods: {
      handleCloseInfoWindow() {
        this.$parent.$emit("close");
      }
    },
    computed: {
      _styleOptions() {
        let {border, square, title, close, content} = this.styleOptions;
        let {border: defaultBorder, square: defaultSquare, title: defaultTitle, close: defaultClose, content: defaultContent} = DEFAULT_INFO_WINDOW_TEMPLATE_STYLE_OPTIONS;
        border = Object.assign({}, defaultBorder, border);
        square = Object.assign({}, defaultSquare, square);
        title = Object.assign({}, defaultTitle, title);
        close = Object.assign({}, defaultClose, close);
        content = Object.assign({}, defaultContent, content);
        let {angle, crossingAngle, background} = square;
        let angleRad = CssUtils.transformAngle(angle).number;
        let crossingAngleRad = CssUtils.transformAngle(crossingAngle).number;


        let skewRad = (Math.PI - 2 * angleRad) / 4;
        let k = Math.sin(crossingAngleRad) / Math.sin(angleRad + crossingAngleRad);
        let hm = Math.cos(skewRad) / Math.sin(crossingAngleRad);
        let wm = Math.cos(skewRad) / Math.sin(angleRad + crossingAngleRad);
        let offsetm = Math.sin(angleRad + 2 * crossingAngleRad) / (Math.cos(angleRad + 2 * crossingAngleRad) - Math.cos(angleRad));

        if(typeof background === 'function') {
          let hwRad = Math.atan(Math.sin(angleRad + crossingAngleRad) / Math.sin(crossingAngleRad));
          background = background.call(null, -hwRad + 'rad');
        }

        return {
          '--borderWidth': border.width,
          '--borderRadius': border.radius,
          '--borderColor': border.color,
          '--borderShadow': border.shadow,

          '--squareBackground': background,
          '--squareShadow': square.shadow,
          '--squareAngle': square.angle,
          '--squareCrossingAngle': square.crossingAngle,
          '--squareHeight': square.height,

          '--squareK': k,
          '--squareHM': hm,
          '--squareWM': wm,
          '--squareOffsetM': offsetm,


          '--titleFontSize': title.fontSize,
          '--titlePadding': title.padding,
          '--titleColor': title.color,
          '--titleBackground': title.background,

          '--closeSize': close.size,
          '--closeTop': close.top,
          '--closeRight': close.right,
          '--closeColor': close.color,
          '--closeHoverColor': close.hoverColor,

          '--contentBackground': content.background,
        };
      }
    }
  }
</script>


<style scoped lang="less">

  .info-window-wrap {
    position: relative;

    @border-width: var(--borderWidth);
    @border-radius: var(--borderRadius);
    @border-color: var(--borderColor);
    @border-shadow: var(--borderShadow);

    @square-background: var(--squareBackground);
    @square-shadow: var(--squareShadow);
    @square-angle: var(--squareAngle);
    @square-crossing-angle: var(--squareCrossingAngle);
    @square-height: var(--squareHeight);

    @title-font-size: var(--titleFontSize);
    @title-padding: var(--titlePadding);
    @title-color: var(--titleColor);
    @title-background: var(--titleBackground);

    @close-size: var(--closeSize);
    @close-top: var(--closeTop);
    @close-right: var(--closeRight);
    @close-color: var(--closeColor);
    @close-hover-color: var(--closeHoverColor);

    @content-background: var(--contentBackground);



    @square-hm: var(--squareHM);
    @square-wm: var(--squareWM);
    @square-offsetm: var(--squareOffsetM);



    @border-offset: ~"calc(0px - @{border-width})";

    @square-skew: ~"calc(45deg - @{square-angle} / 2)";
    @square-h: ~"calc(@{square-height} * @{square-hm})";
    @square-w: ~"calc(@{square-height} * @{square-wm})";
    @square-offset: ~"calc(@{square-height} * @{square-offsetm})";

    .info-window-border {
      z-index: 10;
      position: absolute;
      top: @border-offset;
      bottom: @border-offset;
      left: @border-offset;
      right: @border-offset;
      border-radius: @border-radius;
      border-width: @border-width;
      border-style: solid;
      border-color: @border-color;
      box-shadow: @border-shadow;
      &:before {
        content: '';
        z-index: 20;
        position: absolute;
        width: @square-w;
        height: @square-h;
        border-right-width: @border-width;
        border-bottom-width: @border-width;
        border-right-style: solid;
        border-bottom-style: solid;
        border-right-color: @border-color;
        border-bottom-color: @border-color;
        background: @square-background;
        box-shadow: @square-shadow;
      }
    }


    &[positioning='top-center']>.info-window-border:before {
      @square-rotate-top: ~"calc(@{square-skew} - @{square-crossing-angle} - 90deg)";
      top: ~"calc(0px - @{square-h} / 2)";
      left: ~"calc(50% - @{square-w} / 2 + @{square-offset})";
      transform: rotate(@square-rotate-top) skew(@square-skew, @square-skew);
    }
    &[positioning='bottom-center']>.info-window-border:before {
      @square-rotate-bottom: ~"calc(@{square-skew} - @{square-crossing-angle} + 90deg)";
      bottom: ~"calc(0px - @{square-h} / 2)";
      left: ~"calc(50% - @{square-w} / 2 - @{square-offset})";
      transform: rotate(@square-rotate-bottom) skew(@square-skew, @square-skew);
    }
    &[positioning='center-left']>.info-window-border:before {
      @square-rotate-left: ~"calc(@{square-skew} - @{square-crossing-angle} + 180deg)";
      left: ~"calc(0px - @{square-w} / 2)";
      bottom: ~"calc(50% - @{square-h} / 2 + @{square-offset})";
      transform: rotate(@square-rotate-left) skew(@square-skew, @square-skew);
    }
    &[positioning='center-right']>.info-window-border:before {
      @square-rotate-right: ~"calc(@{square-skew} - @{square-crossing-angle})";
      right: ~"calc(0px - @{square-w} / 2)";
      bottom: ~"calc(50% - @{square-h} / 2 - @{square-offset})";
      transform: rotate(@square-rotate-right) skew(@square-skew, @square-skew);
    }


    .info-window-body {
      z-index: 30;
      position: relative;
      width: max-content;
      width: -moz-max-content;
      min-width: 240px;
      & > .info-window-title-wrap {
        font-size: @title-font-size;
        padding: @title-padding;
        color: @title-color;
        background: @title-background;
        border-top-left-radius: @border-radius;
        border-top-right-radius: @border-radius;
        & > .info-window-title {
          display: inline-block;
          height: 100%;
        }
        & > .info-window-close {
          position: absolute;
          font-size: @close-size;
          top: @close-top;
          right: @close-right;
          color: @close-color;
          &:hover {
            color: @close-hover-color;
          }
        }
      }
      & > .info-window-content-wrap {
        min-height: 120px;
        background: @content-background;
        border-bottom-left-radius: @border-radius;
        border-bottom-right-radius: @border-radius;
      }
    }

  }

</style>
