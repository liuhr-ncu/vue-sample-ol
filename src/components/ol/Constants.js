/**
 * 常用坐标系
 * @type {{EPSG_3857: string, EPSG_4326: string}}
 */
export const PROJECTION = {
  EPSG_3857: 'EPSG:3857',
  EPSG_4326: 'EPSG:4326'
};

/**
 * openlayers一些事件名
 * @type {{MAP_SINGLE_CLICK: string, MAP_POINTER_MOVE: string}}
 */
export const OL_EVENT = {
  MAP_SINGLE_CLICK: 'singleclick',
  MAP_POINTER_MOVE: 'pointermove'
};

/**
 * 地图事件设置的一些标志位
 * @type {{INFO_WINDOW_OPENED: string, MAP_ZOOM_CENTER_CHANGED: string, TRACK_PLAYER_INDEX_CHANGED: string}}
 */
export const OL_EVENT_FLAG = {
  INFO_WINDOW_OPENED: 'INFO_WINDOW_OPENED',
  MAP_ZOOM_CENTER_CHANGED: 'MAP_ZOOM_CENTER_CHANGED',
  TRACK_PLAYER_INDEX_CHANGED: 'TRACK_PLAYER_INDEX_CHANGED'
};

export const TRACK_PLAYER_EVENT = {
  TRACK_CHANGED: 'TRACK_CHANGED',
  TRACK_CLEAR: 'TRACK_CLEAR'
}

/**
 * 绘制管理器事件
 * @type {{DRAW_START: string, DRAW_END: string, MODIFY_START: string, MODIFY_END: string}}
 */
export const DRAW_MANAGER_EVENT = {
  DRAW_START: 'DRAW_START',
  DRAW_END: 'DRAW_END',
  MODIFY_START: 'MODIFY_START',
  MODIFY_END: 'MODIFY_END'
};

/**
 * 要素管理器事件
 * @type {{ADD_FEATURE: string, REMOVE_FEATURE: string, UPDATE_FEATURE: string, HIDE_FEATURE: string, SHOW_FEATURE: string, HIDE_LAYER: string, SHOW_LAYER: string}}
 */
export const FEATURE_MANAGER_EVENT = {
  ADD_FEATURE: 'ADD_FEATURE',
  REMOVE_FEATURE: 'REMOVE_FEATURE',
  UPDATE_FEATURE: 'UPDATE_FEATURE',
  HIDE_FEATURE: 'HIDE_FEATURE',
  SHOW_FEATURE: 'SHOW_FEATURE',
  HIDE_LAYER: 'HIDE_LAYER',
  SHOW_LAYER: 'SHOW_LAYER',
  CLEAR: 'CLEAR'
};

/**
 * 弹窗管理器事件
 * @type {{OPEN: string, CLOSE: string}}
 */
export const INFO_WINDOW_MANAGER_EVENT = {
  OPEN: 'OPEN_INFO_WINDOW',
  CLOSE: 'CLOSE_INFO_WINDOW',
};

/**
 * 默认弹窗模板样式
 * @type {{border: {width: string, radius: string, color: string, shadow: string}, square: {background: function(*), shadow: string, angle: string, crossingAngle: string, height: string}, title: {fontSize: string, padding: string, color: string, background: string}, close: {size: string, top: string, right: string, color: string, hoverColor: string}, content: {background: string}}}
 */
export const DEFAULT_INFO_WINDOW_TEMPLATE_STYLE_OPTIONS = {
  border: {
    width: '1px',
    radius: '5px',
    color: '#0086d0',
    shadow: '1px 1px 20px rgba(0, 0, 0, 0.3)'
  },
  square: {
    background: (hwRad) => {
      return `linear-gradient(${hwRad}, white 50%, transparent 50%)`;
    },
    shadow: '1px 1px 20px rgba(0, 0, 0, 0.3)',
    angle: '30deg',
    crossingAngle: '45deg',
    height: '20px'
  },
  title: {
    fontSize: '12px',
    padding: '6px 10px',
    color: 'white',
    background: '#0086d0'
  },
  close: {
    size: '16px',
    top: '6px',
    right: '8px',
    color: 'white',
    hoverColor: 'white'
  },
  content: {
    background: 'white'
  }
};

/**
 * 图层KEY
 * @type {{LAYER_TYPE: string}}
 */
export const LAYER_KEY = {
  LAYER_TYPE: 'layerType'
};

/**
 * 要素KEY
 * @type {{TYPE: string, ATTRIBUTES: string, FEATURES: string, ACTIVE: string, HOVER: string, HIDE: string}}
 */
export const FEATURE_KEY = {
  TYPE: 'type',
  ATTRIBUTES: 'attributes',
  FEATURES: 'features',
  ACTIVE: 'active',
  HOVER: 'hover',
  HIDE: 'hide'
};

/**
 * 几何对象KEY
 * @type {{DRAW_TYPE: string, MEASURE_RESULT: string}}
 */
export const GEOMETRY_KEY = {
  DRAW_TYPE: 'drawType',
  MEASURE_RESULT: 'measureResult'
};

/**
 * 绘制类型：点、线、矩形、正方形、圆、多边形
 * @type {{POINT: string, LINE: string, RECTANGLE: string, SQUARE: string, CIRCLE: string, POLYGON: string}}
 */
export const DRAW_TYPE = {
  POINT: 'POINT',
  LINE: 'LINE',
  RECTANGLE: 'RECTANGLE',
  SQUARE: 'SQUARE',
  CIRCLE: 'CIRCLE',
  POLYGON: 'POLYGON'
};

/**
 * 量测类型：无、长度(周长)、面积、全部
 * @type {{NONE: string, LENGTH: string, AREA: string, ALL: string}}
 */
export const MEASURE_TYPE = {
  NONE: 'NONE',
  LENGTH: 'LENGTH',
  AREA: 'AREA',
  ALL: 'ALL',
};

/**
 * 弹窗相对覆盖物位置
 * @type {{TOP: string, BOTTOM: string, LEFT: string, RIGHT: string}}
 */
export const POSITIONING = {
  TOP: 'bottom-center',
  BOTTOM: 'top-center',
  LEFT: 'center-right',
  RIGHT: 'center-left'
};

export const TRACK_PLAYER_FEATURE_TYPE = {
  TRACK_LINE: 'TRACK_LINE',
  TRACK_START: 'TRACK_START',
  TRACK_END: 'TRACK_END',
  TRACK_ACTIVE: 'TRACK_ACTIVE'
};

export const TRACK_PLAYER_PLAY_TYPE = {
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD'
};

/**
 * 角度单位
 * @type {{DEG: string, GRAD: string, TURN: string, RAD: string}}
 */
export const ANGLE_UNIT = {
  DEG: 'deg',
  GRAD: 'grad',
  TURN: 'turn',
  RAD: 'rad'
};

/**
 * 常用字符
 * @type {{DEFAULT: string, NUMBER: string, LOW: string, UP: string}}
 */
export const CHARS = {
  DEFAULT: 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890qwertyuiopasdfghjklzxcvbnm',
  NUMBER: '1234567890',
  LOW: 'qwertyuiopasdfghjklzxcvbnm',
  UP: 'QWERTYUIOPASDFGHJKLZXCVBNM'
};

/**
 * 常见错误
 * @type {{CANNOT_INSTANTIATE: string, INVALID_PARAMETER: string}}
 */
export const ERROR = {
  CANNOT_INSTANTIATE: '禁止实例化此类',
  INVALID_PARAMETER: '参数错误'
};




