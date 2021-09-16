import Overlay from 'ol/Overlay';
import * as olExtent from 'ol/extent';
import {Assert} from './CommonUtils';

class InfoWindowManager {

  /**
   * 构造函数实例化
   * @param featureManagerPool
   * @param events
   */
  constructor (featureManagerPool, events) {
    Assert.isTrue(featureManagerPool, '要素管理器池不能为空');
    this._featureManagerPool = featureManagerPool;
    this._feature = undefined;
    this._overlay = undefined;
    this._events = events;
  }

  /**
   * 静态函数实例化
   * @param featureManagerPool
   * @param events
   * @returns {InfoWindowManager}
   */
  static newInstance (featureManagerPool, events) {
    return new InfoWindowManager(featureManagerPool, events);
  }

  /**
   * 事件派发统一入口
   * @param e
   */
  dispatchEvent ({type, data, render = false}) {
    Assert.isTrue(type, '请指定弹窗派发的事件类型!');
    let e = {type, data, manager: this, render};
    let {_events, _feature} = this;
    let callback = _events ? _events[type] : undefined;
    callback && callback.call(null, e);
    //此时重绘要素
    e.render && _feature && _feature.changed();
    return this;
  }

  /**
   * 打开某个要素的弹窗（两种打开方式)
   * @param feature 要素
   * @param type 要素类型
   * @param id 要素ID
   * @param center 要素是否居中显示
   */
  open ({feature, type, id, center = false}) {
    Assert.isTrue(feature != undefined || (type != undefined && id != undefined), '参数错误');
    feature && (type = feature.get('type'), id = undefined);
    let featureManager = this._featureManagerPool.get(type);
    Assert.isTrue(featureManager, '获取要素管理器失败: type = ' + type);
    feature || (feature = featureManager.getFeatureById(id), Assert.isTrue(feature, '获取要素失败: id = ' + id));
    //打开的弹窗要素是同一个要素则什么都不做
    if (this._feature === feature) {
      return this;
    }
    //该要素没有配置弹窗则什么都不做
    let template = featureManager.getTemplate(feature);
    if (!template) {
      return this;
    }

    //居中显示
    if (center) {
      let map = featureManager.getMap(), view = map.getView();
      let position = olExtent.getCenter(feature.getGeometry().getExtent());
      view.setCenter(position);
    }

    //被关闭的要素
    let close = undefined;
    if (this._feature) {
      close = {type: this.getType(), attributes: this.getAttributes()};
    }
    //打开要素
    this._feature = feature;
    //打开的要素
    let open = {type, attributes: this.getAttributes()}, data = {open, close};
    //触发弹窗open事件
    this.dispatchEvent({type: 'infoWindow.open', data, render: true});
    return this;
  }

  /**
   * 关闭当前弹窗
   * @returns {InfoWindowManager}
   */
  close () {
    let type = this.getType(), attributes = this.getAttributes(), data = {type, attributes};
    this._feature = undefined;
    //触发弹窗close事件
    this.dispatchEvent({type: 'infoWindow.close', data, render: true});
    return this;
  }

  /**
   * 获取当前弹窗要素
   * @returns {*}
   */
  getFeature () {
    return this._feature;
  }

  /**
   * 获取当前弹窗要素类型
   * @returns {*|undefined}
   */
  getType () {
    let {_feature} = this;
    return _feature ? _feature.get('type') : undefined;
  }

  /**
   * 获取当前弹窗要素id
   * @returns {*|undefined}
   */
  getId () {
    let {_feature} = this;
    return _feature ? _feature.getId() : undefined;
  }

  /**
   * 获取当前弹窗要素位置
   * @returns {number[]|undefined}
   */
  getPosition () {
    let {_feature} = this;
    return _feature ? olExtent.getCenter(_feature.getGeometry().getExtent()) : undefined;
  }

  /**
   * 获取当前弹窗模板
   * @returns {*}
   */
  getTemplate () {
    let {_feature} = this;
    Assert.isTrue(_feature, '要素不能为空');
    let featureManager = this.getFeatureManager();
    return featureManager.getTemplate(_feature);
  }

  /**
   * 获取当前弹窗要素属性
   * @returns {*}
   */
  getAttributes () {
    let id = this.getId();
    Assert.isTrue(id, '要素ID不能为空');
    let featureManager = this.getFeatureManager();
    return featureManager.getAttributesById(id);
  }

  /**
   * 获取当前弹窗要素管理器
   * @returns {*}
   */
  getFeatureManager () {
    let type = this.getType();
    Assert.isTrue(type, '要素类型不能为空');
    let featureManager = this._featureManagerPool.get(type);
    Assert.isTrue(featureManager, '获取要素管理器失败: type = ' + type);
    return featureManager;
  }

  /**
   * 获取要素管理器池
   * @returns {*}
   */
  getFeatureManagerPool () {
    return this._featureManagerPool;
  }

  /**
   * 弹窗管理器初始化
   * @param $el
   */
  init ($el) {
    let {_overlay, _featureManagerPool} = this, map = _featureManagerPool.getMap();
    Assert.isFalse(_overlay, '弹窗管理器已初始化，请不要重复初始化');

    _overlay = new Overlay({
      element: $el,
      positioning: 'bottom-center',
      autoPan: false,
      offset: [0, -45]
    });
    map.addOverlay(_overlay);
    map.on('singleclick', e => {
      const pixel = map.getEventPixel(e.originalEvent);
      map.forEachFeatureAtPixel(pixel, feature => {
        let features = feature.get('features');
        if (features) {
          if (features.length > 1) {
            let view = map.getView();
            let extent = InfoWindowManager._getFeaturesExtent(features);
            return view.fit(extent, {
              size: map.getSize(),
              padding: [50, 50, 50, 50],
              nearest: true
            });
          }
          feature = features[0];
        }
        this.open({feature});
      });
    });
    this._overlay = _overlay;
  }

  /**
   * 更新弹窗位置
   * @param position
   */
  updateOverlayPosition (position) {
    let {_overlay} = this;
    _overlay && _overlay.setPosition(position);
  }

  /**
   * 获取包含多个要素的最小矩形范围
   * @param features
   * @returns {*}
   * @private
   */
  static _getFeaturesExtent (features) {
    let extent;
    return features.reduce((obj, feature) => {
      extent = feature.getGeometry().getExtent();
      obj[0] = Math.min(obj[0], extent[0], extent[2]);
      obj[1] = Math.min(obj[1], extent[1], extent[3]);
      obj[2] = Math.max(obj[2], extent[0], extent[2]);
      obj[3] = Math.max(obj[3], extent[1], extent[3]);
      return obj;
    }, [180, 90, -180, -90]);
  }


}

export default InfoWindowManager;
