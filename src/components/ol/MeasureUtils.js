import {Point} from 'ol/geom';
import {fromCircle} from 'ol/geom/Polygon';
import {getLength, getArea} from 'ol/sphere';

import {DRAW_TYPE, MEASURE_TYPE, ERROR} from "./Constants";

/**
 *
 * @param val
 * @param precision
 * @returns {number}
 */
const toFixed = function(val, precision = 2) {
  const m = Math.pow(10, precision);
  return Math.round(val * m) / m;
};

/**
 * 量测工具
 */
class MeasureUtils {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }


  /**
   *
   * @param geometry
   * @param projection
   * @param drawType
   * @param measureType
   * @returns {*}
   */
  static getResult(geometry, projection, drawType, measureType) {
    let text = MeasureUtils._getText(geometry, projection, drawType, measureType);
    if(!text) {
      return undefined;
    }
    return {
      text,
      geometry: MeasureUtils._getGeometry(geometry, drawType)
    };
  }

  /**
   * 获取量测计算结果
   * @param geometry
   * @param projection
   * @param drawType
   * @param measureType
   * @returns {*}
   * @private
   */
  static _getText(geometry, projection, drawType, measureType) {
    switch (measureType) {
      case MEASURE_TYPE.ALL:
        let lengthResult = MeasureUtils._getText(geometry, projection, drawType, MEASURE_TYPE.LENGTH);
        let areaResult = MeasureUtils._getText(geometry, projection, drawType, MEASURE_TYPE.AREA);
        return `${lengthResult}, ${areaResult}`;
      case MEASURE_TYPE.AREA:
        return MeasureUtils._getArea(geometry, projection, drawType);
      case MEASURE_TYPE.LENGTH:
        return MeasureUtils._getLength(geometry, projection, drawType);
      case MEASURE_TYPE.NONE:
        return undefined;
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
  }

  /**
   * 获取量测结果显示位置
   * @param geometry
   * @param drawType
   * @returns {*}
   * @private
   */
  static _getGeometry(geometry, drawType) {
    switch (drawType) {
      case DRAW_TYPE.POINT:
        return geometry;
      case DRAW_TYPE.LINE:
        return new Point(geometry.getLastCoordinate());
      case DRAW_TYPE.RECTANGLE:
        return geometry.getInteriorPoint();
      case DRAW_TYPE.SQUARE:
        return geometry.getInteriorPoint();
      case DRAW_TYPE.CIRCLE:
        return new Point(geometry.getCenter());
      case DRAW_TYPE.POLYGON:
        return geometry.getInteriorPoint();
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
  }

  /**
   * 获取几何图形面积
   * @param geometry
   * @param projection
   * @param drawType
   * @returns {string}
   * @private
   */
  static _getArea(geometry, projection, drawType) {
    let area;
    switch (drawType) {
      case DRAW_TYPE.POINT:
        throw new Error(ERROR.INVALID_PARAMETER);
      case DRAW_TYPE.LINE:
        throw new Error(ERROR.INVALID_PARAMETER);
      case DRAW_TYPE.RECTANGLE:
        area = getArea(geometry, {projection});
        break;
      case DRAW_TYPE.SQUARE:
        area = getArea(geometry, {projection});
        break;
      case DRAW_TYPE.CIRCLE:
        area = getArea(fromCircle(geometry), {projection});
        break;
      case DRAW_TYPE.POLYGON:
        area = getArea(geometry, {projection});
        break;
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
    return `面积: ${MeasureUtils._formatArea(area)}`;
  }

  /**
   * 获取几何图形长度|周长
   * @param geometry
   * @param projection
   * @param drawType
   * @returns {string}
   * @private
   */
  static _getLength(geometry, projection, drawType) {
    let length, desc = "周长";
    switch (drawType) {
      case DRAW_TYPE.POINT:
        throw new Error(ERROR.INVALID_PARAMETER);
      case DRAW_TYPE.LINE:
        length = getLength(geometry, {projection});
        desc = "长度";
        break;
      case DRAW_TYPE.RECTANGLE:
        length = getLength(geometry, {projection});
        break;
      case DRAW_TYPE.SQUARE:
        length = getLength(geometry, {projection});
        break;
      case DRAW_TYPE.CIRCLE:
        length = getLength(fromCircle(geometry), {projection});
        break;
      case DRAW_TYPE.POLYGON:
        length = getLength(geometry, {projection});
        break;
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
    return `${desc}: ${MeasureUtils._formatLength(length)}`;
  }

  /**
   * 格式化面积值
   * @param area
   * @returns {string}
   * @private
   */
  static _formatArea(area) {
    if (length > 10000) {
      return toFixed(area / 1000000) + 'km\xB2';
    }
    return toFixed(area) + 'm\xB2';
  }

  /**
   * 格式化长度值
   * @param length
   * @returns {string}
   * @private
   */
  static _formatLength(length) {
    if (length > 100) {
      return toFixed(length / 1000) + 'km';
    }
    return toFixed(length) + 'm';
  }

}

export default MeasureUtils;