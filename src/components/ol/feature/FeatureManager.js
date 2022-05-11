import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import Feature from "ol/Feature";
import {toFunction as toStyleFunction} from "ol/style/Style";

import EventRegistry from "../EventRegistry";
import Assert from "../Assert";
import {FEATURE_KEY, FEATURE_MANAGER_EVENT, ERROR} from "../Constants";
import {createDefaultLayerStyleFunction as createDefaultSingleStyleFunction, createDefaultClusterStyleFunction} from "../DefaultStyle";

/**
 * 默认聚合要素创建方法
 * @param geometry
 * @param features
 * @returns {Feature}
 */
const defaultCreateCluster = function (geometry, features) {
  //如果只有一个要素，那就显示此要素， 否则返回聚合要素
  return features.length === 1 ? features[0] : new Feature({geometry, features});
};

/**
 * 默认单要素样式
 */
const defaultSingleStyle = createDefaultSingleStyleFunction();

/**
 * 默认聚合样式
 */
const defaultClusterStyle = createDefaultClusterStyleFunction();

/**
 * 默认唯一键的获取方法
 * @param attributes
 * @returns {string|*}
 * @constructor
 */
const defaultKey = function (attributes) {
  return attributes.id;
};

const toInfoWindowFunction = function (infoWindow) {
  if (typeof infoWindow === 'function') {
    return infoWindow;
  }
  return function (feature) {
    return infoWindow;
  };
};

/**
 * 要素管理器类, 提供要素的添加、删除、修改、隐藏等功能
 */
class FeatureManager extends EventRegistry{

  /**
   * 地图对象
   */
  _map;

  /**
   * 存放要素的layer
   */
  _layer;

  /**
   * 存放要素的source
   */
  _source;

  /**
   * 类型
   */
  _type;

  /**
   * 唯一键的获取方法
   * @type {defaultKey}
   * @private
   */
  _key = defaultKey;

  /**
   * 构造要素几何图形的方法
   */
  _geometryFunction;

  /**
   * 单要素样式
   */
  _singleStyleFunction = defaultSingleStyle;

  /**
   * 聚合要素样式
   * @type {function(*, *)}
   * @private
   */
  _clusterStyleFunction = defaultClusterStyle;

  /**
   * 要素弹窗 (feature) => InfoWindow
   */
  _infoWindowFunction;

  /**
   * 弹窗管理器
   */
  _infoWindowManager;

  /**
   * 已被隐藏的要素
   */
  _hides = {};

  constructor({
                type,
                key = defaultKey,
                geometry,
                style = defaultSingleStyle,
                infoWindow,
                zIndex = 999
              }) {
    super();
    Assert.isTrue(type, "要素类型不能为空");
    Assert.isTrue(geometry, "要素几何对象创建方法不能为空");

    //
    this.setSingleStyle(style);

    //
    let _source = new VectorSource();
    let _layer = this._createLayer(_source, zIndex, type);

    this._layer = _layer;
    this._source = _source;

    this._type = type;
    this._key = key;
    this._geometryFunction = geometry;
    this._infoWindowFunction = toInfoWindowFunction(infoWindow);

  }

  /**
   * 添加要素
   * @param obj 要素属性(数组)
   * @returns {FeatureManager}
   */
  addFeature(obj) {
    let added = [];
    Array.isArray(obj) || (obj = [obj]);
    obj.forEach(attributes => {
      let id = this.getFeatureId(attributes), feature = this.getFeatureById(id);
      Assert.isTrue(!feature, '该要素已添加，请不要重复添加');
      feature = this._addFeature(id, attributes);
      added.push(feature);
    });
    if(added.length > 0) {
      this._source.addFeatures(added);
    }
    return this;
  }

  /**
   * 更新要素
   * @param obj 要素属性(数组)
   * @returns {FeatureManager}
   */
  updateFeature(obj) {
    let updatedCount = 0;
    Array.isArray(obj) || (obj = [obj]);
    obj.forEach(attributes => {
      let id = this.getFeatureId(attributes), feature = this.getFeatureById(id);
      Assert.isTrue(feature, '待更新要素不存在');
      this._updateFeature(feature, attributes);
      updatedCount++;
    });
    if(updatedCount > 0) {
      this._source.changed();
    }
    return this;
  }

  /**
   * 添加或更新要素
   * @param obj 要素属性(数组)
   * @returns {FeatureManager}
   */
  addOrUpdateFeature(obj) {
    let added = [], updatedCount = 0;
    Array.isArray(obj) || (obj = [obj]);
    obj.forEach(attributes => {
      let id = this.getFeatureId(attributes), feature = this.getFeatureById(id);
      if (feature) {
        this._updateFeature(feature, attributes);
        updatedCount++;
      } else {
        feature = this._addFeature(id, attributes);
        added.push(feature);
      }
    });
    if(added.length > 0) {
      this._source.addFeatures(added);
    } else if(updatedCount > 0) {
      this._source.changed();
    }
    return this;
  }

  /**
   * 移除要素
   * @param obj 要素ID(数组) | 要素属性(数组) | 过滤函数
   * @returns {FeatureManager}
   */
  removeFeature(obj) {
    if(typeof obj === 'function') {
      return this._removeFeaturesByFilter(obj);
    }
    Array.isArray(obj) || (obj = [obj]);
    return this._removeFeaturesByArray(obj);
  }

  /**
   * 显示要素
   * @param obj 要素ID(数组) | 要素属性(数组) | 过滤函数
   * @returns {FeatureManager}
   */
  showFeature(obj) {
    if(typeof obj === 'function') {
      return this._showFeatureByFilter(obj);
    }
    Array.isArray(obj) || (obj = [obj]);
    return this._showFeatureByArray(obj);
  }

  /**
   * 隐藏要素
   * @param obj obj 要素ID(数组) | 要素属性(数组) | 过滤函数
   * @returns {FeatureManager}
   */
  hideFeature(obj) {
    if(typeof obj === 'function') {
      return this._hideFeatureByFilter(obj);
    }
    Array.isArray(obj) || (obj = [obj]);
    return this._hideFeatureByArray(obj);
  }

  /**
   * 显示图层
   * @returns {FeatureManager}
   */
  showLayer() {
    this._layer.setVisible(true);
    this.dispatch(FEATURE_MANAGER_EVENT.SHOW_LAYER);
    return this;
  }

  /**
   * 隐藏图层
   * @returns {FeatureManager}
   */
  hideLayer() {
    this._closeInfoWindowIfMatchType();
    this._layer.setVisible(false);
    this.dispatch(FEATURE_MANAGER_EVENT.HIDE_LAYER);
    return this;
  }

  /**
   * 清除所有要素
   * @returns {FeatureManager}
   */
  clear() {
    this._closeInfoWindowIfMatchType();
    this._hides = {};
    this._source.clear();
    this.dispatch(FEATURE_MANAGER_EVENT.CLEAR);
    return this;
  }

  /**
   * 设置单要素样式
   * @param style
   * @returns {FeatureManager}
   */
  setSingleStyle(style) {
    let {_source} = this;
    this._singleStyleFunction = toStyleFunction(style);
    _source && _source.changed();
    return this;
  }

  /**
   * 设置聚合要素样式
   * @param style
   * @returns {FeatureManager}
   */
  setClusterStyle(style = defaultClusterStyle) {
    let {_source} = this;
    this._clusterStyleFunction = toStyleFunction(style);
    _source && _source.changed();
    return this;
  }

  /**
   * 开启聚合
   * @param distance
   * @param style
   * @returns {FeatureManager}
   */
  cluster(distance = 50, style) {
    style && (this._clusterStyleFunction = toStyleFunction(style));
    let {_layer, _source} = this, cluster = new Cluster({
      distance,
      source: _source,
      createCluster: defaultCreateCluster
    });
    _layer.setSource(cluster);
    return this;
  }

  /**
   * 取消聚合
   * @returns {FeatureManager}
   */
  single() {
    let {_layer, _source} = this;
    _layer.setSource(_source);
    return this;
  }

  /**
   * 遍历要素对象
   * @param callback
   */
  forEachFeature(callback) {
    this._forEachFeatureFromSource(callback);
    this._forEachFeatureFromHides(callback);
  }

  /**
   * 获取所有要素
   * @returns {*}
   */
  getFeatures() {
    return [].concat(this._source.getFeatures(), Object.values(this._hides));
  }

  /**
   * 根据要素id获取要素
   * @param id
   * @returns {*}
   */
  getFeatureById(id) {
    return this._source.getFeatureById(id) || this._hides[id];
  }

  /**
   * 根据要素id获取显示的要素
   * @param id
   * @returns {*}
   */
  getShowFeatureById(id) {
    return this._source.getFeatureById(id);
  }

  /**
   * 根据要素id获取隐藏的要素
   * @param id
   * @returns {*}
   */
  getHideFeatureById(id) {
    return this._hides[id];
  }

  /**
   * 根据要素属性获取要素id
   * @param attributes
   * @returns {*}
   */
  getFeatureId(attributes) {
    return this._key.call(null, attributes);
  }

  /**
   * 根据要素属性获取要素几何图形
   * @param attributes
   * @private
   */
  getGeometry(attributes) {
    return this._geometryFunction.call(null, attributes);
  }

  /**
   * 获取要素管理器类型
   * @returns {*}
   */
  getType() {
    return this._type;
  }

  /**
   * 获取弹窗管理器
   * @returns {*}
   */
  getInfoWindowManager() {
    return this._infoWindowManager;
  }

  /**
   * 获取弹窗配置对象
   * @param feature
   */
  getInfoWindow(feature) {
    return this._infoWindowFunction.call(null, feature);
  }

  /**
   * 获取地图对象
   * @returns {*}
   */
  getMap() {
    return this._map;
  }

  /**
   *
   * @returns {*}
   */
  getSource() {
    return this._source;
  }

  /**
   *
   * @returns {*}
   */
  getLayer() {
    return this._layer;
  }


  /**
   * 要素管理器是否已激活
   * @returns {boolean}
   */
  isActive() {
    return this._map !== undefined;
  }

  /**
   * 激活要素管理器
   * @param infoWindowManager
   * @returns {FeatureManager}
   */
  active(infoWindowManager) {
    Assert.isTrue(!this.isActive(), '要素管理器已被使用， 不可再次使用');
    Assert.isTrue(infoWindowManager, '参数[infoWindowManager]不能为空');

    const map = infoWindowManager.getMap();
    map.addLayer(this._layer);

    this._map = map;
    this._infoWindowManager = infoWindowManager;

    return this;
  }



  /******************************私有方法[start]*****************************************/

  /**
   * @param source
   * 创建图层
   * @param zIndex
   * @param layerType
   * @private
   */
  _createLayer(source, zIndex, layerType) {
    let that = this;
    return new VectorLayer({
      source,
      style: function (feature, resolution) {
        let features = feature.get(FEATURE_KEY.FEATURES);
        if (features) {
          if(features.length > 1) {
            return that._getClusterStyle(arguments);
          }
          //此时arguments也会被修改
          arguments[0] = features[0];
        }
        return that._getSingleStyle(arguments);
      },
      zIndex,
      layerType
    });
  }

  /**
   * 移除要素
   * @param filter 过滤函数
   * @returns {FeatureManager}
   * @private
   */
  _removeFeaturesByFilter(filter) {
    this.forEachFeature(feature => {
      filter.call(null, feature) && this._removeFeature(feature);
    });
    return this;
  }

  /**
   * 移除要素
   * @param array 要素ID数组 | 要素属性数组
   * @returns {FeatureManager}
   * @private
   */
  _removeFeaturesByArray(array) {
    array.forEach(id => {
      typeof id === 'object' && (id = this.getFeatureId(id));
      let feature = this.getFeatureById(id);
      feature && this._removeFeature(feature);
    });
    return this;
  }

  /**
   * 隐藏要素
   * @param filter 过滤函数
   * @returns {FeatureManager}
   * @private
   */
  _hideFeatureByFilter(filter) {
    this._forEachFeatureFromSource(feature => {
      filter.call(null, feature) && this._hideFeature(feature);
    });
    return this;
  }

  /**
   * 隐藏要素
   * @param array 要素ID数组 | 要素属性数组
   * @returns {FeatureManager}
   * @private
   */
  _hideFeatureByArray(array) {
    array.forEach(id => {
      typeof id === 'object' && (id = this.getFeatureId(id));
      let feature = this.getShowFeatureById(id);
      feature && this._hideFeature(feature);
    });
    return this;
  }

  /**
   * 显示要素
   * @param filter 过滤函数
   * @returns {FeatureManager}
   * @private
   */
  _showFeatureByFilter(filter) {
    let showed = [];
    this._forEachFeatureFromHides(feature => {
      filter.call(null, feature) && (this._showFeature(feature), showed.push(feature));
    });
    showed.length > 0 && this._source.addFeatures(showed);
    return this;
  }

  /**
   * 显示要素
   * @param array 要素ID数组 | 要素属性数组
   * @returns {FeatureManager}
   * @private
   */
  _showFeatureByArray(array) {
    let feature, showed = [];
    array.forEach(id => {
      typeof id === 'object' && (id = this.getFeatureId(id));
      feature = this.getHideFeatureById(id);
      feature && (this._showFeature(feature), showed.push(feature));
    });
    showed.length > 0 && this._source.addFeatures(showed);
    return this;
  }

  /**
   * 创建新要素
   * @param id
   * @param attributes
   * @private
   */
  _addFeature(id, attributes) {
    let {_type} = this, geometry = this.getGeometry(attributes);
    const feature = new Feature({geometry});
    feature.setId(id);
    feature.set(FEATURE_KEY.TYPE, _type, true);
    feature.set(FEATURE_KEY.ATTRIBUTES, attributes, true);
    this.dispatch(FEATURE_MANAGER_EVENT.ADD_FEATURE, feature);
    return feature;
  }

  /**
   * 更新要素
   * @param feature
   * @param attributes
   * @private
   */
  _updateFeature(feature, attributes) {
    const _attributes = feature.get(FEATURE_KEY.ATTRIBUTES), geometryName = feature.getGeometryName();
    attributes = Object.assign({}, _attributes, attributes);

    feature.set(FEATURE_KEY.ATTRIBUTES, attributes, true);
    feature.set(geometryName, this.getGeometry(attributes), true);
    this.dispatch(FEATURE_MANAGER_EVENT.UPDATE_FEATURE, feature);
  }

  /**
   * 移除要素
   * @param feature 要素对象
   * @private
   */
  _removeFeature(feature) {
    let hide = feature.get(FEATURE_KEY.HIDE);
    if(hide) {
      delete this._hides[feature.getId()];
    } else {
      this._closeInfoWindowIfMatchFeature(feature);
      //OpenLayers中的渲染基于渲染帧，当16ms内移除200个要素时，地图只重绘一次
      this._source.removeFeature(feature);
    }
    this.dispatch(FEATURE_MANAGER_EVENT.REMOVE_FEATURE, feature);
  }

  /**
   * 隐藏要素
   * @param feature
   * @private
   */
  _hideFeature(feature) {
    feature.set(FEATURE_KEY.HIDE, true, true);
    this._hides[feature.getId()] = feature;
    this._closeInfoWindowIfMatchFeature(feature);
    //OpenLayers中的渲染基于渲染帧，当16ms内移除200个要素时，地图只重绘一次
    this._source.removeFeature(feature);
    this.dispatch(FEATURE_MANAGER_EVENT.HIDE_FEATURE, feature);
  }

  /**
   * 显示要素
   * @param feature
   * @private
   */
  _showFeature(feature) {
    feature.unset(FEATURE_KEY.HIDE, true);
    delete this._hides[feature.getId()];
    this.dispatch(FEATURE_MANAGER_EVENT.SHOW_FEATURE, feature);
  }

  /**
   * 获取单要素样式
   * @param params
   * @private
   */
  _getSingleStyle(params) {
    let feature = params[0], styleFunction = feature.getStyleFunction() || this._singleStyleFunction;
    return styleFunction.apply(null, params);
  }

  /**
   * 获取聚合要素样式
   * @param params
   * @returns {*}
   * @private
   */
  _getClusterStyle(params) {
    let feature = params[0], styleFunction = feature.getStyleFunction() || this._clusterStyleFunction;
    return styleFunction.apply(null, params);
  }

  /**
   * 如果传入要素的弹窗已被打开，则关闭弹窗
   * @param feature
   * @private
   */
  _closeInfoWindowIfMatchFeature(feature) {
    let infoWindowManager = this.getInfoWindowManager();
    infoWindowManager && infoWindowManager.closeIfMatchFeature(feature);
  }

  /**
   * 如果已被打开的弹窗类型与本要素管理器类型一致，则关闭弹窗
   * @private
   */
  _closeInfoWindowIfMatchType() {
    let infoWindowManager = this.getInfoWindowManager();
    infoWindowManager && infoWindowManager.closeIfMatchType(this._type);
  }

  /**
   * 遍历显示的要素
   * @param callback
   * @private
   */
  _forEachFeatureFromSource(callback) {
    const {_source} = this;
    _source.forEachFeature(callback);
  }

  /**
   * 遍历隐藏的要素
   * @param callback
   * @private
   */
  _forEachFeatureFromHides(callback) {
    const {_hides} = this;
    for(let id in _hides) {
      callback.call(null, _hides[id]);
    }
  }

  /******************************私有方法[end]*****************************************/


  /******************************静态方法[start]*****************************************/

  /**
   * 组合多个要素管理器为一个新的要素管理器
   * @param type
   * @param classify
   * @param zIndex
   * @param featureManagers
   * @returns {FeatureManager}
   */
  static compose({type, classify, zIndex = 999, featureManagers}) {

    Assert.isTrue(classify, '参数classify不能为空');

    const featureManagerMap = featureManagers.reduce((obj, featureManager) => {
      let _type = featureManager.getType();
      Assert.isTrue(!featureManager.isActive(), '合并失败， 要素管理器已被使用： type=' + _type);
      obj[_type] = featureManager;
      return obj;
    }, {});

    const getManagerByAttributes = function (attributes) {
      let _type = classify.call(null, attributes);
      let featureManager = featureManagerMap[_type];
      Assert.isTrue(featureManager, '未找到要素管理器: type=' + _type);
      return featureManager;
    };

    const getManagerByFeature = function (feature) {
      let attributes = feature.get(FEATURE_KEY.ATTRIBUTES);
      return getManagerByAttributes(attributes);
    };

    type || (type = featureManagers.map(featureManager => featureManager.getType()).join('_'));

    const key = function (attributes) {
      let featureManager = getManagerByAttributes(attributes);
      return featureManager.getType() + '#' + featureManager.getFeatureId(attributes);
    };

    const geometry = function (attributes) {
      let featureManager = getManagerByAttributes(attributes);
      return featureManager.getGeometry(attributes);
    };

    const style = function (feature, resolution) {
      let featureManager = getManagerByFeature(feature);
      return featureManager._getSingleStyle(arguments);
    };

    const infoWindow = function (feature) {
      let featureManager = getManagerByFeature(feature);
      return featureManager.getInfoWindow(feature);
    };

    return new FeatureManager({
      type,
      key,
      geometry,
      style,
      infoWindow,
      zIndex
    });

  }

  /******************************静态方法[end]*****************************************/

}

export default FeatureManager;
