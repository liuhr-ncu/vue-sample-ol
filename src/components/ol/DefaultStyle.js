import {Style, Text, Fill, Circle, Stroke, RegularShape} from "ol/style";
import {createDefaultStyle, createEditingStyle} from "ol/style/Style";
import GeometryType from "ol/geom/GeometryType";
import {FEATURE_KEY} from "./Constants";


/**
 * 默认聚合样式
 * @returns {function(*, *)}
 */
export function createDefaultClusterStyleFunction() {
  const cache = {};
  return function(feature, resolution) {
    const size = feature.get(FEATURE_KEY.FEATURES).length;
    let style = cache[size];
    if (!style) {
      let imageStrokeColor = size > 25 ? 'rgba(192, 0, 0, 0.5)' : size > 8 ? 'rgba(255, 128, 0, 0.5)' : 'rgba(0, 128, 0, 0.5)';
      let imageFillColor = size > 25 ? 'rgba(192, 0, 0, 1)' : size > 8 ? 'rgba(255, 128, 0, 1)' : 'rgba(0, 128, 0, 1)';
      let radius = Math.max(10, Math.min(size * 0.75, 18));
      let lineDash = (2 * Math.PI * radius) / 6;
      lineDash = [0, lineDash, lineDash, lineDash, lineDash, lineDash, lineDash];
      style = cache[size] = [
        new Style({
          image: new Circle({
            radius,
            stroke: new Stroke({
              color: imageStrokeColor,
              width: 15,
              lineDash,
              lineCap: 'butt'
            }),
            fill: new Fill({
              color: imageFillColor
            })
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({color: '#fff'})
          })
        })
      ];
    }
    return style;
  };
}

/**
 * 默认测量样式
 * @returns {*}
 */
export function createDefaultMeasureStyle() {
  return new Style({
    text: new Text({
      font: '14px Calibri,sans-serif',
      fill: new Fill({
        color: [255, 255, 255, 1]
      }),
      backgroundFill: new Fill({
        color: [0, 153, 255, 0.6]
      }),
      padding: [3, 3, 3, 3],
      textBaseline: 'bottom',
      offsetY: -8
    }),
    image: new RegularShape({
      radius: 6,
      points: 3,
      angle: Math.PI,
      displacement: [0, 3],
      fill: new Fill({
        color: [0, 153, 255, 0.6]
      })
    })
  });
}

/**
 * 默认编辑样式
 * @returns {Function}
 */
export function createDefaultModifyStyleFunction() {
  const style = createEditingStyle();
  return function (feature, resolution) {
    return style[GeometryType.POINT];
  }
}


/**
 * 默认绘制样式
 * @returns {Function}
 */
export function createDefaultDrawStyleFunction() {
  const style = createEditingStyle();
  return function (feature, resolution) {
    return style[feature.getGeometry().getType()];
  }
}

/**
 * 默认图层样式
 * @returns {*}
 */
export function createDefaultLayerStyleFunction() {
  return createDefaultStyle;
}
