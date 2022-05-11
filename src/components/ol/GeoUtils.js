import {ERROR} from "./Constants";

/**
 *
 */
class GeoUtils {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  /**
   * 获取两点构成的射线夹角
   * @param start
   * @param end
   * @returns {number}
   */
  static getRotation(start, end) {
    return Math.atan2(1, 0) - Math.atan2(end[1] - start[1], end[0] - start[0]);
  }

  /**
   * 格式化经度
   * @param lon
   * @param precision
   * @returns {string}
   */
  static formatLon(lon, precision = 2) {
    return GeoUtils._formatLonLat(lon, precision, 'E', 'W');
  }

  /**
   * 格式化纬度
   * @param lat
   * @param precision
   * @returns {string}
   */
  static formatLat(lat, precision = 2) {
    return GeoUtils._formatLonLat(lat, precision, 'N', 'S');
  }

  /**
   * 格式化经纬度
   * @param lonLat
   * @param precision
   * @returns {*[]}
   */
  static formatLonLat(lonLat, precision = 2) {
    return [GeoUtils.formatLon(lonLat[0], precision), GeoUtils.formatLat(lonLat[1], precision)];
  }


  /**
   *
   * @param val
   * @param precision
   * @param positiveSymbol
   * @param negativeSymbol
   * @returns {string}
   * @private
   */
  static _formatLonLat(val, precision = 2, positiveSymbol, negativeSymbol) {
    let symbol = val > 0 ? positiveSymbol : negativeSymbol;
    let res = GeoUtils._transformToDegree(val, precision);
    return `${symbol} ${res[0]}°${res[1]}′${res[2]}″`;
  }

  /**
   *
   * @param val
   * @param precision
   * @returns {Array}
   * @private
   */
  static _transformToDegree(val, precision = 2) {
    let res = [];

    res[0] = parseInt(val);
    val = (val - res[0]) * 60;

    res[1] = parseInt(val);
    val = (val - res[1]) * 60;

    res[2] = val.toFixed(precision);

    return res;
  }

}


export default GeoUtils;