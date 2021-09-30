import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import {Style, Icon, Text, Fill} from 'ol/style';
import {Assert} from './CommonUtils';

import clusterImg1 from './img/cl1.png';
import clusterImg2 from './img/cl2.png';
import clusterImg3 from './img/cl3.png';

/**
 * 默认聚合样式
 * @param feature
 */
const defaultClusterStyle = feature => {
  let features = feature.get('features');
  let size = features.length;
  let image, color;
  if (size < 10) {
    image = clusterImg1;
    color = '#000';
  } else if (size < 50) {
    image = clusterImg2;
    color = '#fff';
  } else {
    image = clusterImg3;
    color = '#fff';
  }
  return [
    new Style({
      image: new Icon({
        rotation: 0,
        src: image
      }),
      text: new Text({
        text: size.toString(),
        fill: new Fill({color})
      })
    })
  ];
};

/**
 * 要素样式获取(单要素样式、聚合要素样式)
 * @param style
 */
const getStyles = style => {
  let singleStyle, clusterStyle;
  if (typeof style === 'function') {
    singleStyle = style;
    clusterStyle = defaultClusterStyle;
  } else {
    singleStyle = style.single;
    clusterStyle = style.cluster || defaultClusterStyle;
  }
  return {singleStyle, clusterStyle};
};

/**
 * 要素弹窗默认的offset
 * @type {number[]}
 */
const defaultOffset = [0, 0];

class FeatureManager {

  /**
   * 要素管理器构造函数
   * @param type
   * @param classify
   * @param key
   * @param geometry
   * @param infoWindow
   * @param style
   * @param zIndex
   * @param cluster
   * @param distance
   * @param visible
   */
  constructor ({
    type,
    classify,
    key = attributes => attributes.id,
    geometry,
    infoWindow,
    style,
    zIndex = 999,
    cluster = true,
    distance = 50,
    visible = true
  }) {
    Assert.isTrue(type, '要素类型不能为空');
    Assert.isTrue(geometry, '要素几何对象创建方法不能为空');
    Assert.isTrue(!infoWindow || (infoWindow.template && infoWindow.manager), '必须同时提供弹窗模板及弹窗管理器');
    Assert.isTrue(style, '要素样式不能为空');

    let source = new VectorSource();
    let _source = cluster ? new Cluster({
      distance,
      source
    }) : source;

    let {singleStyle, clusterStyle} = getStyles(style);
    let _style = feature => {
      let features = feature.get('features');
      if (features) {
        return features.length === 1 ? singleStyle.call(null, features[0]) : clusterStyle.call(null, feature);
      }
      return singleStyle.call(null, feature);
    };

    let layer = new VectorLayer({
      style: _style,
      source: _source,
      zIndex,
      visible
    });

    this._type = type;
    this._classify = classify;
    this._key = key;
    this._geometry = geometry;
    this._infoWindow = infoWindow;
    this._singleStyle = singleStyle;
    this._source = source;
    this._layer = layer;
    this._map = undefined;
  }


  /**
   * 添加或更新多个要素
   * @param obj
   * @returns {FeatureManager}
   */
  addFeatures (obj) {
    for (let key in obj) {
      this.addFeature(obj[key]);
    }
    return this;
  }

  /**
   * 添加或更新单个要素
   * @param attributes
   * @returns {FeatureManager}
   */
  addFeature (attributes) {
    let id = this._key.call(null, attributes), feature = this.getFeatureById(id);
    feature ? this._updateFeature(feature, attributes) : this._addFeature(id, attributes);
    return this;
  }

  /**
   * 根据要素过滤器移除要素
   * @param filter
   * @returns {FeatureManager}
   */
  removeFeatures (filter) {
    let {_source, _infoWindow} = this, infoWindowManager, _feature;
    _infoWindow && (infoWindowManager = _infoWindow.manager, _feature = infoWindowManager._feature);
    _source.forEachFeature((feature) => {
      if (filter.call(null, feature)) {
        _feature === feature && infoWindowManager.close()
        _source.removeFeature(feature);
      }
    });
    return this;
  }

  /**
   * 根据要素ID移除多个要素
   * @param array
   * @returns {FeatureManager}
   */
  removeFeatureByIds (array) {
    let {_source, _infoWindow} = this, infoWindowManager, _feature;
    _infoWindow && (infoWindowManager = _infoWindow.manager, _feature = infoWindowManager._feature);
    array.forEach( _id => {
      let feature = _source.getFeatureById(_id);
      _feature === feature && infoWindowManager.close();
      feature && _source.removeFeature(feature);
    });
    return this;
  }

  /**
   * 根据要素ID移除单个要素
   * @param _id
   * @returns {FeatureManager}
   */
  removeFeatureById (_id) {
    let {_source, _infoWindow} = this, infoWindowManager, _feature;
    _infoWindow && (infoWindowManager = _infoWindow.manager, _feature = infoWindowManager._feature);
    let feature = _source.getFeatureById(_id);
    _feature === feature && infoWindowManager.close();
    feature && _source.removeFeature(feature);
    return this;
  }

  /**
   * 清除所有要素
   * @returns {FeatureManager}
   */
  clear () {
    let {_type, _source, _infoWindow} = this, infoWindowManager, type;
    _infoWindow && (infoWindowManager = _infoWindow.manager, type = infoWindowManager.getType());
    type === _type && infoWindowManager.close();
    _source.clear();
    return this;
  }

  /**
   * 隐藏所有要素
   * @returns {FeatureManager}
   */
  hide () {
    let {_type, _layer, _infoWindow} = this, infoWindowManager, type;
    _infoWindow && (infoWindowManager = _infoWindow.manager, type = infoWindowManager.getType());
    type === _type && infoWindowManager.close();
    _layer.setVisible(false);
    return this;
  }

  /**
   * 显示所有要素
   * @returns {FeatureManager}
   */
  show () {
    this._layer.setVisible(true);
    return this;
  }

  /**
   * 重绘要素管理器中的要素
   */
  changed() {
    this._source.changed();
  }

  /**
   * 获取要素管理器类型
   * @returns {*}
   */
  getType () {
    return this._type;
  }

  /**
   * 获取要素弹窗offset
   * @param feature
   * @returns {*}
   */
  getOffset(feature) {
    let {_infoWindow} = this, offset;
    _infoWindow && (offset = _infoWindow.offset);
    if (typeof offset === 'function') {
      Assert.isTrue(feature, "要素不能为空");
      offset = offset.call(null, feature);
    }
    offset || (offset = defaultOffset)
    return offset;
  }

  /**
   * 获取要素弹窗模板
   * @returns {*}
   */
  getTemplate (feature) {
    let {_infoWindow} = this, template;
    _infoWindow && (template = _infoWindow.template);
    if (typeof template === 'function') {
      Assert.isTrue(feature, "要素不能为空");
      template = template.call(null, feature);
    }
    return template;
  }

  /**
   * 根据要素ID查询要素
   * @param id
   * @returns {import("../Feature.js").default<Geometry>}
   */
  getFeatureById (id) {
    return this._source.getFeatureById(id);
  }

  /**
   * 判断要素管理器是否已使用
   * @returns {boolean}
   */
  isUsed () {
    return this._map != undefined;
  }

  /**
   * 获取地图
   * @returns {*}
   */
  getMap () {
    return this._map;
  }

  /**
   * 将多个未使用的要素管理器聚合到一起
   * @param type
   * @param classify
   * @param separator
   * @param clusterStyle
   * @param zIndex
   * @param distance
   * @param visible
   * @param featureManagers
   * @returns {FeatureManager}
   */
  static cluster ({
    type,
    classify,
    separator = '#',
    clusterStyle = defaultClusterStyle,
    zIndex = 999,
    distance = 50,
    visible = true
  }, ...featureManagers) {

    const featureManagerMap = featureManagers.reduce((obj, featureManager) => {
      let _type = featureManager.getType();
      Assert.isFalse(featureManager.isUsed(), '合并失败， 要素管理器已被使用: type = ' + _type);
      obj[_type] = featureManager;
      return obj;
    }, {});

    const getManagerByAttributes = attributes => {
      let _type = classify.call(null, attributes);
      let featureManager = featureManagerMap[_type];
      Assert.isTrue(featureManager, '未找到要素管理器: type = ' + _type);
      return featureManager;
    };

    const getManagerByFeature = feature => {
      let id = feature.getId(), index = id.indexOf(separator);
      let _type = id.substring(0, index);
      let featureManager = featureManagerMap[_type];
      Assert.isTrue(featureManager, '未找到要素管理器: type = ' + _type);
      return featureManager;
    };

    type || (type = featureManagers.map(featureManager => featureManager.getType()).join(separator));
    const key = function (attributes) {
      let featureManager = getManagerByAttributes(attributes);
      return featureManager.getType() + separator + featureManager._key.call(null, attributes);
    };

    const geometry = attributes => {
      let featureManager = getManagerByAttributes(attributes);
      return featureManager._geometry.call(null, attributes);
    };

    const offset = feature => {
      let featureManager = getManagerByFeature(feature), _infoWindow = featureManager._infoWindow, _offset;
      _infoWindow && (_offset = _infoWindow.offset);
      if (typeof _offset === 'function') {
        _offset = _offset.call(null, feature);
      }
      return _offset;
    };

    const template = feature => {
      let featureManager = getManagerByFeature(feature), _infoWindow = featureManager._infoWindow, _template;
      _infoWindow && (_template = _infoWindow.template);
      if (typeof _template === 'function') {
        _template = _template.call(null, feature);
      }
      return _template;
    };

    const manager = featureManagers.reduce((obj, featureManager) => {
      let _infoWindow = featureManager._infoWindow, _infoWindowManager;
      _infoWindow && (_infoWindowManager = _infoWindow.manager);
      Assert.isFalse(obj && _infoWindowManager && (obj != _infoWindowManager), '错误，出现多个弹窗管理器');
      return _infoWindowManager || obj;
    }, undefined);

    const infoWindow = manager ? {manager, template, offset} : undefined;

    const style = {
      single: function (feature) {
        let featureManager = getManagerByFeature(feature);
        return featureManager._singleStyle.call(null, feature);
      },
      cluster: clusterStyle
    };

    return new FeatureManager({
      type,
      classify,
      key,
      geometry,
      infoWindow,
      style,
      zIndex,
      cluster: true,
      distance,
      visible
    });

  }

  /**
   * 添加要素, attributes中不能有_type字段(预留标记要素类型)
   * @param id
   * @param attributes
   * @private
   */
  _addFeature (id, attributes) {
    let {_type, _classify, _source, _geometry} = this;
    const feature = new Feature({
      geometry: _geometry.call(null, attributes)
    });
    feature.setId(id);
    feature.set('type', _type, true);
    feature.set('classify', _classify ? _classify.call(null, attributes) : _type, true);
    feature.set('attributes', attributes, true);
    _source.addFeature(feature);
  }

  /**
   * 更新要素
   * @param feature
   * @param attributes
   * @private
   */
  _updateFeature (feature, attributes) {
    let {_geometry} = this;
    const _attributes = feature.get('attributes');
    Object.assign(_attributes, attributes);
    feature.setGeometry(_geometry.call(null, _attributes));
  }

  /**
   * 使用到指定的地图上
   * @param map
   * @returns {FeatureManager}
   * @private
   */
  _usedTo (map) {
    Assert.isFalse(this.isUsed(), '要素管理器已被使用，不可再次使用');
    Assert.isTrue(map, '地图对象不能为空');
    map.addLayer(this._layer);
    this._map = map;
    return this;
  }

}

export default FeatureManager;
