import * as olExtent from "ol/extent";
import {transform} from "ol/proj";

import {ERROR} from "./Constants";

class OLUtils {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  /**
   * 获取几何对象中心
   * @param geometry
   */
  static getGeometryCenter(geometry) {
    return olExtent.getCenter(geometry.getExtent());
  }

  /**
   * 设置地图中心
   * @param map
   * @param geometry
   */
  static setMapCenter(map, geometry) {
    let view = map.getView();
    view.setCenter(OLUtils.getGeometryCenter(geometry));
  }

  /**
   * 放大缩小地图,默认放大两级
   * @param map
   * @param step
   */
  static incrementMapZoom(map, step = 2) {
    let view = map.getView();
    view.setZoom(view.getZoom() + step);
  }

  /**
   * 坐标转换
   * @param lngLat
   * @param projection
   * @param targetProjection
   */
  static transform(lngLat, projection, targetProjection) {
    return transform(lngLat, projection, targetProjection);
  }

}

export default OLUtils;