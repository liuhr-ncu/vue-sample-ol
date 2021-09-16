import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import {Style, Icon, Text, Fill} from 'ol/style';
import {Assert, Optional} from './CommonUtils';

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
    let {_key, _data} = this, id = _key.call(this, attributes), old = _data[id];
    old ? this._updateFeature(attributes, old) : this._addFeature(attributes);
    return this;
  }

  /**
   *
   * @param filter
   * @returns {FeatureManager}
   */
  removeFeatures (filter) {
    let {_type, _source, _data, _infoWindow} = this, {manager = undefined} = _infoWindow, attributes, feature;
    let type = Optional.of(manager).map(m => m.getType()).orElse(undefined);
    let id = Optional.of(manager).map(m => m.getId()).orElse(undefined);
    for (let _id in _data) {
      attributes = _data[_id];
      filter.call(this, attributes) && (
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
    let {_type, _source, _data, _infoWindow} = this, {manager = undefined} = _infoWindow, _id, feature;
    let type = Optional.of(manager).map(m => m.getType()).orElse(undefined);
    let id = Optional.of(manager).map(m => m.getId()).orElse(undefined);
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
    let {_type, _source, _data, _infoWindow} = this, {manager = undefined} = _infoWindow, feature;
    let type = Optional.of(manager).map(m => m.getType()).orElse(undefined);
    let id = Optional.of(manager).map(m => m.getId()).orElse(undefined);
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
    let {_type, _source, _infoWindow} = this, {manager = undefined} = _infoWindow;
    let type = Optional.of(manager).map(m => m.getType()).orElse(undefined);
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
    let {_type, _layer, _infoWindow} = this, {manager = undefined} = _infoWindow;
    let type = Optional.of(manager).map(m => m.getType()).orElse(undefined);
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
   *
   * @returns {*}
   */
  getType () {
    return this._type;
  }

  /**
   *
   * @returns {*}
   */
  getTemplate () {
    return Optional.of(this._infoWindow).map(infoWindow => infoWindow.template).orElse(undefined);
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
   * @param manager
   * @param type
   * @param classify
   * @param clusterStyle
   * @param zIndex
   * @param cluster
   * @param distance
   * @param visible
   * @returns {FeatureManager}
   */
  merge (manager, {
    type,
    classify,
    clusterStyle = defaultClusterStyle,
    zIndex = 999,
    cluster = true,
    distance = 50,
    visible = true
  }) {
    return FeatureManager.merges({type, classify, clusterStyle, zIndex, cluster, distance, visible}, this, manager);
  }

  /**
   *
   * @param type
   * @param classify
   * @param clusterStyle
   * @param zIndex
   * @param cluster
   * @param distance
   * @param visible
   * @param managers
   * @returns {FeatureManager}
   */
  static merges ({
    type,
    classify,
    clusterStyle = defaultClusterStyle,
    zIndex = 999,
    cluster = true,
    distance = 50,
    visible = true
  }, ...managers) {
    const _map = managers.reduce((obj, _manager) => {
      let _type = _manager.getType();
      Assert.isFalse(_manager.isUsed(), '合并失败， 要素管理器已被使用: type = ' + _type);
      obj[_type] = _manager;
      return obj;
    }, {});

    const getManagerByAttributes = attributes => {
      let _type = classify.call(null, attributes);
      let _manager = _map[_type];
      Assert.isTrue(_manager, '未找到要素管理器: type = ' + _type);
      return _manager;
    };

    const getManagerByFeature = feature => {
      let id = feature.getId(), index = id.indexOf('#');
      let _type = id.substring(0, index);
      let _manager = _map[_type];
      Assert.isTrue(_manager, '未找到要素管理器: type = ' + _type);
      return _manager;
    };

    type || (type = managers.map(_manager => _manager.getType()).join('#'));
    const key = function (attributes) {
      let _manager = getManagerByAttributes(attributes);
      return _manager.getType() + '#' + _manager._key.call(this, attributes);
    };

    const geometry = function (attributes) {
      let _manager = getManagerByAttributes(attributes);
      return _manager._geometry.call(this, attributes);
    };

    const template = function (attributes) {
      let _manager = getManagerByAttributes(attributes), _infoWindow = _manager._infoWindow;
      let _template = Optional.of(_infoWindow).map(w => w.template).orElse(undefined);
      while (typeof _template === 'function') {
        _template = _template.call(this, attributes);
      }
      return _template;
    };

    const manager = managers.reduce((obj, _manager) => {
      let _infoWindow = _manager._infoWindow, _infoWindowManager = Optional.of(_infoWindow).map(w => w.manager).orElse(undefined);
      Assert.isFalse(obj && _infoWindowManager && (obj != _infoWindowManager), '错误，出现多个弹窗管理器');
      return _infoWindowManager || obj;
    }, undefined);

    const infoWindow = manager ? {template, manager} : undefined;

    const style = {
      single: function (feature) {
        let _manager = getManagerByFeature(feature);
        return _manager._singleStyle.call(this, feature);
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
      cluster,
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
    for (let key in obj) {
      this.addFeature(obj[key]);
    }
  }

  /**
   *
   * @param attributes
   * @private
   */
  _addFeature (attributes) {
    let {_type, _key, _source, _geometry, _data} = this, id = _key.call(this, attributes);
    _data[id] = attributes;
    const feature = new Feature({
      geometry: _geometry.call(this, attributes)
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
    let {_key, _source, _geometry} = this, id = _key.call(this, attributes);
    const feature = _source.getFeatureById(id);
    feature.setGeometry(_geometry.call(this, old));
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
