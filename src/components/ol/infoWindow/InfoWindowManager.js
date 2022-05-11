import Overlay from "ol/Overlay";
import Feature from "ol/Feature";

import FeatureManagerPool from "../feature/FeatureManagerPool";

import EventRegistry from "../EventRegistry";
import Assert from "../Assert";
import {OL_EVENT, OL_EVENT_FLAG, LAYER_KEY, FEATURE_KEY, INFO_WINDOW_MANAGER_EVENT, ERROR} from "../Constants";
import OLUtils from "../OLUtils";



/**
 * 弹窗管理器，提供打开、关闭弹窗等功能
 */
class InfoWindowManager extends EventRegistry{

  /**
   * 地图对象
   */
  _map;

  /**
   * 弹窗显示不全时是否自动移动地图
   */
  _autoPan;

  /**
   * 当前被打开弹窗的要素
   */
  _feature;

  /**
   * 弹窗覆盖物
   */
  _overlay;

  /**
   * 要素管理器池
   */
  _featureManagerPool;

  constructor(map, autoPan = true) {
    super();
    Assert.isTrue(map, "地图对象不能为空");
    this._map = map;
    this._autoPan = autoPan;
    this._addMapEventListener();

    this._featureManagerPool = FeatureManagerPool.newInstance(this);
  }

  /**
   * 打开某要素弹窗
   * @param feature {Feature|{type, attributes}}
   * @param center
   * @returns {InfoWindowManager}
   */
  open(feature, center = false) {
    Assert.isTrue(feature, ERROR.INVALID_PARAMETER);
    if(feature instanceof Feature) {
      this._openByFeature(feature, center);
    } else {
      this._openByAttributes(feature, center);
    }
    return this;
  }

  /**
   * 关闭当前弹窗
   * @returns {InfoWindowManager}
   */
  close() {
    let data = this._feature;
    this._feature = undefined;
    this.dispatch(INFO_WINDOW_MANAGER_EVENT.CLOSE, data);
    return this;
  }

  /**
   * 如果当前被打开弹窗的要素与给定要素一致，则关闭弹窗
   * @param feature
   */
  closeIfMatchFeature(feature) {
    let {_feature} = this;
    _feature === feature && this.close();
    return this;
  }

  /**
   * 如果当前弹窗类型与给定类型一致，则关闭弹窗
   * @param type
   * @returns {InfoWindowManager}
   */
  closeIfMatchType(type) {
    let {_feature} = this;
    if(_feature) {
      let _type = _feature.get(FEATURE_KEY.TYPE);
      _type === type && this.close();
    }
    return this;
  }

  /**
   * 设置弹窗覆盖物位置
   * @param position
   * @returns {InfoWindowManager}
   */
  setInfoWindowPosition(position) {
    let {_overlay} = this;
    _overlay && _overlay.setPosition(position);
    return this;
  }

  /**
   * 获取当前被打开弹窗的要素
   * @returns {*}
   */
  getFeature() {
    return this._feature;
  }

  /**
   * 获取当前弹窗
   * @returns {*|FeatureManager._template}
   */
  getInfoWindow() {
    let {_feature} = this;
    Assert.isTrue(_feature, "要素不能为空");
    let type = _feature.get(FEATURE_KEY.TYPE);
    let featureManager = this._featureManagerPool.get(type);
    return featureManager.getInfoWindow(_feature);
  }

  /**
   * 获取弹窗管理器池
   * @returns {*}
   */
  getFeatureManagerPool() {
    return this._featureManagerPool;
  }

  /**
   * 获取地图对象
   * @returns {*}
   */
  getMap() {
    return this._map;
  }

  /**
   * 弹窗管理器是否已激活
   * @returns {boolean}
   */
  isActive() {
    return this._overlay !== undefined;
  }

  /**
   * 激活弹窗管理器
   * @param $el
   * @returns {InfoWindowManager}
   */
  active($el) {
    Assert.isTrue(!this.isActive(), "弹窗管理器已被使用， 不可再次使用");
    let {_map, _autoPan} = this;
    let _overlay = new Overlay({
      element: $el,
      autoPan: _autoPan
    });
    _map.addOverlay(_overlay);
    this._overlay = _overlay;
    return this;
  }


  /******************************私有方法[start]*****************************************/

  /**
   * 添加地图点击事件(点击要素打开要素弹窗)
   * @private
   */
  _addMapEventListener() {
    let {_map} = this;
    _map.on(OL_EVENT.MAP_SINGLE_CLICK, e => {
      _map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
        //return true时不会再向下遍历,设置propagationStopped = true则阻止事件冒泡,这里设置标记changedMapZoom、opendInfoWindow、
        let features = feature.get(FEATURE_KEY.FEATURES);
        if (features) {
          if (features.length > 1) {
            OLUtils.incrementMapZoom(_map);
            OLUtils.setMapCenter(_map, feature.getGeometry());
            e[OL_EVENT_FLAG.MAP_ZOOM_CENTER_CHANGED] = true;
            return true;
          }
          feature = features[0];
        }
        try{
          this.open(feature);
          e[OL_EVENT_FLAG.INFO_WINDOW_OPENED] = true;
          return true;
        } catch (e) {
          console.warn(e);
        }
      }, {
        layerFilter: layer => {
          return layer.get(LAYER_KEY.LAYER_TYPE);
        }
      });
    });

    let oldHoverFeature;
    _map.on(OL_EVENT.MAP_POINTER_MOVE, e => {
      const pixel = e.pixel;
      const hit = _map.hasFeatureAtPixel(pixel);
      _map.getTargetElement().style.cursor = hit ? "pointer" : "";

      let nowHoverFeature;
      _map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
        //return true时不会再向下遍历
        let features = feature.get(FEATURE_KEY.FEATURES);
        if (features) {
          //聚合要素不另外设置样式
          if (features.length > 1) {
            return true;
          }
          feature = features[0];
        }
        //hoverFeature设置为feature
        nowHoverFeature = feature;
        return true;
      }, {
        layerFilter: layer => {
          return layer.get(LAYER_KEY.LAYER_TYPE);
        }
      });

      if(nowHoverFeature !== oldHoverFeature) {
        oldHoverFeature && oldHoverFeature.unset(FEATURE_KEY.HOVER);
        nowHoverFeature && nowHoverFeature.set(FEATURE_KEY.HOVER, true);
        oldHoverFeature = nowHoverFeature;
      }

    });
  }

  /**
   * 根据Feature打开弹窗
   * @param feature
   * @param center
   * @private
   */
  _openByFeature(feature, center) {

    let type = feature.get(FEATURE_KEY.TYPE);
    Assert.isTrue(type, "打开弹窗失败, 图层类型为空");

    let featureManager = this._featureManagerPool.get(type);
    Assert.isTrue(featureManager, "打开弹窗失败, 无法获取要素管理器: type = " + type);

    this._doOpen(featureManager, feature, center);
  }

  /**
   * 根据图层类型和要素属性打开弹窗
   * @param type
   * @param attributes
   * @param center
   * @private
   */
  _openByAttributes({type, attributes}, center) {

    Assert.isTrue(type, "打开弹窗失败, 图层类型不能为空");
    Assert.isTrue(attributes, "打开弹窗失败, 要素属性不能为空");

    let featureManager = this._featureManagerPool.get(type);
    Assert.isTrue(featureManager, "打开弹窗失败, 无法获取要素管理器: type = " + type);

    let featureId = featureManager.getFeatureId(attributes);
    let feature = featureManager.getShowFeatureById(featureId);

    this._doOpen(featureManager, feature, center);

  }

  /**
   * 打开弹窗
   * @param featureManager
   * @param feature
   * @param center
   * @returns {InfoWindowManager}
   * @private
   */
  _doOpen(featureManager, feature, center) {

    if (this._feature === feature) {
      return this;
    }

    let infoWindow = featureManager.getInfoWindow(feature);
    Assert.isTrue(infoWindow, "打开弹窗失败, 未配置弹窗模板");

    center && OLUtils.setMapCenter(this._map, feature.getGeometry());

    let {_overlay} = this, positioning = infoWindow.positioning(), offset = infoWindow.offset();
    _overlay.setPositioning(positioning);
    _overlay.setOffset(offset);

    let data = {open: feature, close: this._feature};
    this._feature = feature;
    this.dispatch(INFO_WINDOW_MANAGER_EVENT.OPEN, data);

  }

  /******************************私有方法[end]*****************************************/


  /******************************静态方法[start]*****************************************/

  /**
   * 静态函数实例化
   * @param map
   * @param autoPan
   * @returns {InfoWindowManager}
   */
  static newInstance(map, autoPan = true) {
    return new InfoWindowManager(map, autoPan);
  }

  /******************************静态方法[end]*****************************************/

}

export default InfoWindowManager;