import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import {Draw, Modify} from "ol/interaction";
import GeometryType from "ol/geom/GeometryType";
import {createBox, createRegularPolygon} from "ol/interaction/Draw";
import {toFunction as toStyleFunction} from "ol/style/Style";

import EventRegistry from "../EventRegistry";
import Assert from "../Assert";
import MeasureUtils from "../MeasureUtils";
import OLUtils from "../OLUtils";
import {DRAW_MANAGER_EVENT, GEOMETRY_KEY, MEASURE_TYPE, ERROR} from "../Constants";
import {
  createDefaultLayerStyleFunction,
  createDefaultDrawStyleFunction,
  createDefaultModifyStyleFunction,
  createDefaultMeasureStyle
} from "../DefaultStyle";



/**
 * 默认样式
 * @type {{layer: *, draw: Function, modify: Function, measure: *}}
 */
const defaultStyles = {
  layer: createDefaultLayerStyleFunction(),
  draw: createDefaultDrawStyleFunction(),
  modify: createDefaultModifyStyleFunction(),
  measure: createDefaultMeasureStyle()
};

/**
 * 不同绘制类型的默认量测类型
 * @type {{POINT: string, LINE: string, RECTANGLE: string, SQUARE: string, CIRCLE: string, POLYGON: string}}
 */
const defaultMeasureTypes = {
  POINT: MEASURE_TYPE.NONE,
  LINE: MEASURE_TYPE.LENGTH,
  RECTANGLE: MEASURE_TYPE.AREA,
  SQUARE: MEASURE_TYPE.AREA,
  CIRCLE: MEASURE_TYPE.AREA,
  POLYGON: MEASURE_TYPE.AREA
};

/**
 * 不同绘制类型的绘制参数
 * @type {{POINT: {type: string|drawOptions.POINT|{type}|RegExp}, LINE: {type: *}, RECTANGLE: {type: string|drawOptions.CIRCLE|{type}, geometryFunction: *}, SQUARE: {type: string|drawOptions.CIRCLE|{type}, geometryFunction: *}, CIRCLE: {type: string|drawOptions.CIRCLE|{type}}, POLYGON: {type: string|drawOptions.POLYGON|{type}}}}
 */
const drawOptions = {
  POINT: {type: GeometryType.POINT},
  LINE: {type: GeometryType.LINE_STRING},
  RECTANGLE: {type: GeometryType.CIRCLE, geometryFunction: createBox()},
  SQUARE: {type: GeometryType.CIRCLE, geometryFunction: createRegularPolygon(4)},
  CIRCLE: {type: GeometryType.CIRCLE},
  POLYGON: {type: GeometryType.POLYGON}
}

/**
 * 监听几何对象变化时重新计算结果
 * @param e
 */
const measureListener = function (e) {
  let {target} = e, drawType = target.get(GEOMETRY_KEY.DRAW_TYPE);
  let {_map, _measureTypes} = this, projection = _map.getView().getProjection(), measureType = _measureTypes[drawType];

  let measureResult = MeasureUtils.getResult(target, projection, drawType, measureType);
  target.set(GEOMETRY_KEY.MEASURE_RESULT, measureResult, true);
};


/**
 * 绘制管理器,提供绘制点、线、矩形、正方形、圆形、多边形及测量距离，面积等功能
 */
class DrawManager extends EventRegistry {

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
   * 绘制器
   */
  _draw;

  /**
   * 编辑器
   */
  _modify;

  /**
   * 图层样式
   */
  _layerStyleFunction;

  /**
   * 绘制器样式
   */
  _drawStyleFunction;

  /**
   * 编辑器样式
   */
  _modifyStyleFunction;

  /**
   * 量测结果样式
   */
  _measureStyle;

  /**
   * 不同绘制类型的量测类型
   * @type {{POINT: string, LINE: string, RECTANGLE: string, SQUARE: string, CIRCLE: string, POLYGON: string}}
   * @private
   */
  _measureTypes = defaultMeasureTypes;

  /**
   * 是否开启量测
   * @type {boolean}
   * @private
   */
  _enableMeasure = true;

  /**
   * 开始新的绘制时是否清除历史绘制
   * @type {boolean}
   * @private
   */
  _clearHistory = true;

  constructor(styles = defaultStyles, zIndex = 999) {
    super();

    //
    this.setStyles(styles);

    //
    let _source = new VectorSource();
    let _layer = this._createLayer(_source, zIndex);
    let _modify = this._createModify(_source);

    //
    this._layer = _layer;
    this._source = _source;
    this._modify = _modify;
  }

  /**
   * 设置样式
   * @param styles
   */
  setStyles(styles) {
    styles = Object.assign({}, defaultStyles, styles);
    let {layer, draw, modify, measure} = styles;
    this.setLayerStyle(layer);
    this.setDrawStyle(draw);
    this.setModifyStyle(modify);
    this.setMeasureStyle(measure);
    return this;
  }

  /**
   * 设置不同绘制类型的量测类型
   * @param types
   * @returns {DrawManager}
   */
  setMeasureTypes(types) {
    let {_measureTypes} = this;
    this._measureTypes = Object.assign({}, _measureTypes, types);
    return this;
  }

  /**
   * 设置图层样式
   * @param style
   * @returns {DrawManager}
   */
  setLayerStyle(style) {
    let {_source} = this;
    this._layerStyleFunction = toStyleFunction(style);
    _source && _source.changed();
    return this;
  }

  /**
   * 设置绘制器样式
   * @param style
   * @returns {DrawManager}
   */
  setDrawStyle(style) {
    this._drawStyleFunction = toStyleFunction(style);
    return this;
  }

  /**
   * 设置编辑器样式
   * @param style
   * @returns {DrawManager}
   */
  setModifyStyle(style) {
    this._modifyStyleFunction = toStyleFunction(style);
    return this;
  }

  /**
   * 设置量测样式
   * @param style
   * @returns {DrawManager}
   */
  setMeasureStyle(style) {
    let {_source} = this;
    this._measureStyle = style;
    _source && _source.changed();
    return this;
  }

  /**
   * 开启/关闭编辑
   * @param enableModify
   * @returns {DrawManager}
   */
  modify(enableModify = true) {
    let {_modify} = this;
    _modify.setActive(enableModify);
    return this;
  }

  /**
   * 是否开启编辑
   * @returns {*}
   */
  isEnabledModify() {
    let {_modify} = this;
    return _modify.getActive();
  }

  /**
   * 开启/关闭量测
   * @returns {DrawManager}
   */
  measure(enableMeasure = true) {
    this._enableMeasure = enableMeasure;
    this._source.changed();
    return this;
  }

  /**
   * 是否开启量测
   * @returns {*|boolean}
   */
  isEnabledMeasure() {
    return this._enableMeasure;
  }

  /**
   * 开启/关闭绘制 (传入DRAW_TYPE时开启绘制，传入false时关闭绘制)
   * @param drawType {string|boolean}
   * @returns {DrawManager}
   */
  draw(drawType) {
    if(String(drawType).toLowerCase() === 'false') {
      return this._disableDraw();
    }

    Assert.isTrue(drawType, ERROR.INVALID_PARAMETER);
    let that = this, {_source, _draw, _map} = this, drawOption = drawOptions[drawType];

    Assert.isTrue(_map, "绘制管理器未激活");
    Assert.isTrue(drawOption, ERROR.INVALID_PARAMETER);
    drawOption = Object.assign({}, drawOption, {
      source: _source,
      style: function (feature, resolution) {
        let {_drawStyleFunction} = that, style = _drawStyleFunction.apply(this, arguments);
        return that._adjustStyle(style, feature);
      }
    });
    _draw && _map.removeInteraction(_draw);
    _draw = new Draw(drawOption);
    _draw.on('drawstart', e => {

      this._beforeAddGeometry();

      let {feature} = e, geometry = feature.getGeometry();
      geometry.set(GEOMETRY_KEY.DRAW_TYPE, drawType);
      geometry.on('change', e => measureListener.call(this, e));

      this.dispatch(DRAW_MANAGER_EVENT.DRAW_START, e);
    });
    _draw.on('drawend', e => {
      this.dispatch(DRAW_MANAGER_EVENT.DRAW_END, e);
    });
    _map.addInteraction(_draw);
    this._draw = _draw;

    return this;
  }

  /**
   * 是否开启绘制
   * @returns {*|boolean}
   */
  isEnabledDraw() {
    return this._draw !== undefined;
  }

  /**
   * 设置开始新的绘制时是否清除历史绘制
   * @param clearHistory
   * @returns {DrawManager}
   */
  clearHistory(clearHistory = true) {
    this._clearHistory = clearHistory;
    return this;
  }

  /**
   * 开始新的绘制时是否清除历史绘制
   * @returns {*|boolean}
   */
  isClearHistory() {
    return this._clearHistory;
  }

  /**
   * 添加几何图形
   * @param drawType
   * @param geometry
   * @returns {DrawManager}
   */
  addGeometry(drawType, geometry, center = false) {

    this._beforeAddGeometry();

    geometry.set(GEOMETRY_KEY.DRAW_TYPE, drawType);
    measureListener.call(this, {target: geometry});

    center && OLUtils.setMapCenter(this._map, geometry);

    const feature = new Feature({geometry});
    this._source.addFeature(feature);
    return this;
  }

  /**
   * 清空几何对象
   * @returns {DrawManager}
   */
  clear() {
    this._source.clear();
    return this;
  }

  /**
   * 绘制工具是否已激活
   * @returns {boolean}
   */
  isActive() {
    return this._map !== undefined;
  }

  /**
   * 激活绘制工具
   * @param map
   * @returns {DrawManager}
   */
  active(map) {
    Assert.isTrue(!this.isActive(), '绘制管理器已被使用， 不可再次使用');
    Assert.isTrue(map, '参数[map]不能为空');

    map.addLayer(this._layer);
    map.addInteraction(this._modify);

    this._map = map;
    return this;
  }



  /**
   * 创建编辑器
   * @param source
   * @returns {*}
   * @private
   */
  _createModify(source) {
    let that = this, _modify = new Modify({
      source,
      style: function (feature, resolution) {
        let {_modifyStyleFunction} = that;
        return _modifyStyleFunction.apply(this, arguments);
      }
    });
    _modify.on('modifystart', e => {
      this.dispatch(DRAW_MANAGER_EVENT.MODIFY_START, e);
    });
    _modify.on('modifyend', e => {
      this.dispatch(DRAW_MANAGER_EVENT.MODIFY_END, e);
    });
    _modify.setActive(true);
    return _modify;
  }

  /**
   * 创建图层
   * @param source
   * @param zIndex
   * @private
   */
  _createLayer(source, zIndex) {
    let that = this;
    return new VectorLayer({
      source,
      style: function (feature, resolution) {
        let {_layerStyleFunction} = that, style = _layerStyleFunction.apply(this, arguments);
        return that._adjustStyle(style, feature);
      },
      zIndex
    });
  }

  /**
   * 关闭绘制
   * @returns {DrawManager}
   */
  _disableDraw() {
    let {_draw, _map} = this;
    Assert.isTrue(_map, "绘制工具未激活");

    _draw && _map.removeInteraction(_draw);

    this._draw = undefined;
    return this;
  }

  /**
   * 添加新的几何图形前可能需要清除历史绘制
   * @private
   */
  _beforeAddGeometry() {
    this._clearHistory && this.clear();
  }

  /**
   * 调整样式(显示/不显示量测结果)
   * @param style
   * @param feature
   * @returns {*}
   * @private
   */
  _adjustStyle(style, feature) {
    let {_enableMeasure} = this;
    if (_enableMeasure) {
      let measureResult = feature.getGeometry().get(GEOMETRY_KEY.MEASURE_RESULT);
      if (measureResult) {
        style = [].concat(style);
        let {_measureStyle} = this, {geometry, text} = measureResult;
        _measureStyle.setGeometry(geometry);
        _measureStyle.getText().setText(text);
        style.push(_measureStyle);
      }
    }
    return style;
  }
  
  /**
   * 静态函数实例化
   * @returns {DrawManager}
   */
  static newInstance(styles = defaultStyles, zIndex = 999) {
    return new DrawManager(styles, zIndex);
  }

}

export default DrawManager;