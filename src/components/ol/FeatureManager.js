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
 * 图层样式获取(单要素样式、聚合要素样式)
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

const defaultOffset = [0, 0];

class FeatureManager {

  /**
   *
   * @param type
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

    let source = new VectorSource({
      features: []
    });
    let _source = cluster ? new Cluster({
      distance,
      source
    }) : source;
    let {singleStyle, clusterStyle} = getStyles(style);
    let _style = feature => {
      let features = feature.get('features');
      if (features) {
        return features.length === 1 ? singleStyle.call(this, features[0]) : clusterStyle.call(this, feature);
      }
      return singleStyle.call(this, feature);
    };
    let layer = new VectorLayer({
      style: _style,
      source: _source,
      zIndex,
      visible
    });

    this._type = type;
    this._key = key;
    this._geometry = geometry;
    this._infoWindow = infoWindow;
    this._singleStyle = singleStyle;
    this._source = source;
    this._layer = layer;
    this._map = undefined;
    this._data = {};
  }

  /**
   *
   * @param obj
   * @returns {FeatureManager}
   */
  addFeatures (obj) {
    Array.isArray(obj) ? this._addFeaturesUsingArray(obj) : this._addFeaturesUsingObj(obj);
    return this;
  }

  /**
   *
   * @param attributes
   * @returns {FeatureManager}
   */
  addFeature (attributes) {
    let {_data, _key} = this, id = _key.call(null, attributes), old = _data[id];
    old ? this._updateFeature(attributes, old) : this._addFeature(attributes);
    return this;
  }

  /**
   *
   * @param filter
   * @returns {FeatureManager}
   */
  removeFeatures (filter) {
    let {_type, _source, _data, _infoWindow} = this, manager, attributes, feature, type, id;
    _infoWindow && (manager = _infoWindow.manager);
    manager && (type = manager.getType(), id = manager.getId());
    for (let _id in _data) {
      attributes = _data[_id];
      filter.call(null, attributes) && (
        (type === _type && id === _id && manager.close()),
        delete _data[id],
        feature = _source.getFeatureById(_id),
        feature && _source.removeFeature(feature)
      );
    }
    return this;
  }

  /**
   *
   * @param array
   * @returns {FeatureManager}
   */
  removeFeatureByIds (array) {
    let {_type, _source, _data, _infoWindow} = this, manager, _id, feature, type, id;
    _infoWindow && (manager = _infoWindow.manager);
    manager && (type = manager.getType(), id = manager.getId());
    for (let index = 0, length = array.length; index < length; index++) {
      _id = array[index];
      type === _type && id === _id && manager.close();
      delete _data[_id];
      feature = _source.getFeatureById(_id);
      feature && _source.removeFeature(feature);
    }
    return this;
  }

  /**
   *
   * @param _id
   * @returns {FeatureManager}
   */
  removeFeatureById (_id) {
    let {_type, _source, _data, _infoWindow} = this, manager, feature, type, id;
    _infoWindow && (manager = _infoWindow.manager);
    manager && (type = manager.getType(), id = manager.getId());
    type === _type && id === _id && manager.close();
    delete _data[_id];
    feature = _source.getFeatureById(_id);
    feature && _source.removeFeature(feature);
    return this;
  }

  /**
   *
   * @returns {FeatureManager}
   */
  clear () {
    let {_type, _source, _infoWindow} = this, manager, type;
    _infoWindow && (manager = _infoWindow.manager);
    manager && (type = manager.getType());
    type === _type && manager.close();
    this._data = {};
    _source.clear();
    return this;
  }

  /**
   *
   * @returns {FeatureManager}
   */
  hide () {
    let {_type, _layer, _infoWindow} = this, manager, type;
    _infoWindow && (manager = _infoWindow.manager);
    manager && (type = manager.getType());
    type === _type && manager.close();
    _layer.setVisible(false);
    return this;
  }

  /**
   *
   * @returns {FeatureManager}
   */
  show () {
    this._layer.setVisible(true);
    return this;
  }

  /**
   * 重绘
   */
  changed() {
    this._source.changed();
  }

  /**
   *
   * @returns {*}
   */
  getType () {
    return this._type;
  }

  /**
   *
   * @param feature
   * @returns {*}
   */
  getOffset(feature) {
    let {_infoWindow} = this, offset;
    _infoWindow && (offset = _infoWindow.offset);
    if (typeof offset === 'function') {
      Assert.isTrue(feature, "要素不能为空");
      let id = feature.getId();
      Assert.isTrue(id, "要素ID不能为空");
      let attributes = this.getAttributesById(id);
      do {
        offset = offset.call(null, attributes);
      } while (typeof offset === 'function');
    }
    offset || (offset = defaultOffset)
    return offset;
  }

  /**
   *
   * @returns {*}
   */
  getTemplate (feature) {
    let {_infoWindow} = this, template;
    _infoWindow && (template = _infoWindow.template);
    if (typeof template === 'function') {
      Assert.isTrue(feature, "要素不能为空");
      let id = feature.getId();
      Assert.isTrue(id, "要素ID不能为空");
      let attributes = this.getAttributesById(id);
      do {
        template = template.call(null, attributes);
      } while (typeof template === 'function');
    }
    return template;
  }

  /**
   *
   * @returns {*|{}}
   */
  getData () {
    return this._data;
  }

  /**
   *
   * @param id
   * @returns {*}
   */
  getAttributesById (id) {
    return this._data[id];
  }

  /**
   *
   * @param id
   * @returns {import("../Feature.js").default<Geometry>}
   */
  getFeatureById (id) {
    return this._source.getFeatureById(id);
  }

  /**
   *
   * @param id
   * @returns {boolean}
   */
  hasFeature (id) {
    return this._data[id] != undefined;
  }

  /**
   *
   * @returns {boolean}
   */
  isUsed () {
    return this._map != undefined;
  }

  /**
   *
   * @returns {*}
   */
  getMap () {
    return this._map;
  }

  /**
   *
   * @param type
   * @param classify
   * @param separator
   * @param clusterStyle
   * @param zIndex
   * @param distance
   * @param visible
   * @param managers
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

    const offset = attributes => {
      let featureManager = getManagerByAttributes(attributes), _infoWindow = featureManager._infoWindow, _offset;
      _infoWindow && (_offset = infoWindow.offset);
      while (typeof _offset === 'function') {
        _offset = _offset.call(null, attributes);
      }
      return _offset;
    };

    const template = attributes => {
      let featureManager = getManagerByAttributes(attributes), _infoWindow = featureManager._infoWindow, _template;
      _infoWindow && (_template = infoWindow.template);
      while (typeof _template === 'function') {
        _template = _template.call(null, attributes);
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
        return featureManager._singleStyle.call(this, feature);
      },
      cluster: clusterStyle
    };

    return new FeatureManager({
      type,
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
   *
   * @param array
   * @private
   */
  _addFeaturesUsingArray (array) {
    for (let index = 0, length = array.length; index < length; index++) {
      this.addFeature(array[index]);
    }
  }

  /**
   *
   * @param obj
   * @private
   */
  _addFeaturesUsingObj (obj) {
    for (let i in obj) {
      this.addFeature(obj[i]);
    }
  }

  /**
   *
   * @param attributes
   * @private
   */
  _addFeature (attributes) {
    let {_type, _key, _source, _geometry, _data} = this, id = _key.call(null, attributes);
    _data[id] = attributes;
    const feature = new Feature({
      geometry: _geometry.call(null, attributes)
    });
    feature.setId(id);
    feature.set('type', _type);
    _source.addFeature(feature);
  }

  /**
   *
   * @param attributes
   * @param old
   * @private
   */
  _updateFeature (attributes, old) {
    Object.assign(old, attributes);
    let {_key, _source, _geometry} = this, id = _key.call(null, attributes);
    const feature = _source.getFeatureById(id);
    feature.setGeometry(_geometry.call(null, old));
  }

  /**
   *
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
