import {LineString, MultiLineString, Point} from "ol/geom";
import {getLength, getDistance} from "ol/sphere";
import {transform} from "ol/proj";


import FeatureManager from "../feature/FeatureManager";
import Assert from "../Assert";
import EventRegistry from "../EventRegistry";
import GeoUtils from "../GeoUtils";
import {
  TRACK_PLAYER_FEATURE_TYPE, TRACK_PLAYER_PLAY_TYPE, TRACK_PLAYER_EVENT,
  PROJECTION, OL_EVENT, OL_EVENT_FLAG, ERROR
} from "../Constants";


/**
 * 默认轨迹坐标获取方法
 * @param lng
 * @param lat
 * @returns {*[]}
 */
const defaultCoordinatesFunction = function ({lng, lat}) {
  return [lng, lat];
};

/**
 * 默认各轨迹要素管理器类型
 * @type {{LINE: string, POINT: string, COMPOSE: string}}
 */
const defaultTrackPlayerFeatureManagerTypes = {
  LINE: 'track_line',
  POINT: 'track_point',
  COMPOSE: 'track_player'
};



/**
 * 轨迹回放类
 */
class TrackPlayer extends EventRegistry {

  /**
   * 轨迹回放要素管理器
   */
  _trackPlayerFeatureManager;

  /**
   * 播放器时间间隔(ms)
   * @type {number}
   * @private
   */
  _interval = 50;

  /**
   * 播放类型(前进播放、后退播放)
   * @type {string}
   * @private
   */
  _playType = TRACK_PLAYER_PLAY_TYPE.FORWARD;

  /**
   * 轨迹类型
   */
  _type;

  /**
   * 当前回放位置
   * @type {number}
   * @private
   */
  _index = 0;

  /**
   * 回放数据
   * @type {Array}
   * @private
   */
  _data = [];

  /**
   * 播放器
   */
  _timer;

  constructor(trackPlayerFeatureManager, interval = 50) {
    super();
    Assert.isTrue(!trackPlayerFeatureManager || trackPlayerFeatureManager.isActive(), ERROR.INVALID_PARAMETER);
    Assert.isTrue(interval > 0, ERROR.INVALID_PARAMETER);
    this._trackPlayerFeatureManager = trackPlayerFeatureManager;
    this._interval = interval;
    trackPlayerFeatureManager && this._addMapEventListener();
  }

  /**
   * 获取历轨迹回放要素管理器
   * @returns {*}
   */
  getFeatureManager() {
    return this._trackPlayerFeatureManager;
  }

  /**
   * 获取播放间隔
   * @returns {number}
   */
  interval() {
    return this._interval;
  }

  /**
   * 获取播放类型
   * @returns {string}
   */
  playType() {
    return this._playType;
  }

  /**
   * 获取播放器状态
   * @returns {boolean}
   */
  playing() {
    return this._timer !== undefined;
  }

  /**
   * 下标最大值
   * @returns {number}
   */
  max() {
    return this._data.length - 1;
  }

  /**
   * 当前下标
   * @returns {number}
   */
  index() {
    return this._index;
  }

  /**
   * 当前百分比
   * @returns {number}
   */
  percent() {
    let max = this.max();
    return max === 0 ? 0 : 100 * this.index() / max;
  }

  /**
   * 播放
   * @returns {TrackPlayer}
   */
  play() {
    this.pause();
    this._timer = this._createTimer();
    return this;
  }

  /**
   * 暂停
   * @returns {TrackPlayer}
   */
  pause() {
    this._timer && (clearInterval(this._timer), this._timer = undefined);
    return this;
  }

  /**
   * 前进
   * @returns {*}
   */
  forward() {
    return this.setIndex(this._index + 1);
  }

  /**
   * 后退
   * @returns {*}
   */
  backward() {
    return this.setIndex(this._index - 1);
  }

  /**
   * 清空
   * @returns {TrackPlayer}
   */
  clear() {
    //停止播放
    this.pause();
    //重置数据
    this._index = 0;
    this._data = [];
    //清空要素
    this._trackPlayerFeatureManager.clear();

    this.dispatch(TRACK_PLAYER_EVENT.TRACK_CLEAR);
    return this;
  }

  /**
   * 设置播放间隔
   * @param interval
   * @returns {TrackPlayer}
   */
  setInterval(interval) {
    Assert.isTrue(interval > 0, ERROR.INVALID_PARAMETER);
    this._interval = interval;
    this._timer && this.play();
    return this;
  }

  /**
   * 设置播放类型
   * @param playType
   * @returns {TrackPlayer}
   */
  setPlayType(playType) {
    Assert.isTrue(TrackPlayer.__validPlayType(playType), ERROR.INVALID_PARAMETER);
    this._playType = playType;
    this._timer && this.play();
    return this;
  }

  /**
   * 跳转到指定index
   * @param index
   * @returns {TrackPlayer}
   */
  setIndex(index) {
    let {_trackPlayerFeatureManager, _type, _data} = this, max = _data.length - 1;
    index <= 0 && (index = 0, this._isBackwardPlay() && this.pause());
    index >= max && (index = max, this._isForwardPlay() && this.pause());
    _trackPlayerFeatureManager.updateFeature(
      Object.assign({_featureType: TRACK_PLAYER_FEATURE_TYPE.TRACK_ACTIVE, _type}, _data[index])
    );
    this._index = index;
    return this;
  }

  /**
   * 设置轨迹数据
   * @param track [{}, {}.....{}] 或者 [[{}, {}.....{}], [{}, {}.....{}].....[{}, {}.....{}]]
   * @param step 步长(米)默认为50,设置为false时就不进行平滑处理
   * @returns {TrackPlayer}
   */
  setTrack({
             type,
             track,
             step = 50
           }) {
    //检查数据格式
    Assert.isTrue(Array.isArray(track) && track.length > 0, ERROR.INVALID_PARAMETER);
    Assert.isTrue(step === false || step > 0, ERROR.INVALID_PARAMETER);

    //如果是单段轨迹格式，则转为多段轨迹格式
    Array.isArray(track[0]) || (track = [track]);

    //设置轨迹类型
    this._type = type;
    //清空
    this.clear();
    //轨迹处理
    this._resolveTrack(track, step);
    return this;
  }


  /**
   * 轨迹处理
   * @param track
   * @param step
   * @private
   */
  _resolveTrack(track, step) {

    let {_trackPlayerFeatureManager, _type} = this;
    _trackPlayerFeatureManager.hideLayer();

    let trackLineFeature = this._addFeature({
      _featureType: TRACK_PLAYER_FEATURE_TYPE.TRACK_LINE,
      _type,
      track
    }), data = this._resolveTrackFeature(trackLineFeature, track, step);

    let trackStartFeature = this._addFeature(
      Object.assign({_featureType: TRACK_PLAYER_FEATURE_TYPE.TRACK_START, _type}, data[0])
    );

    let trackEndFeature = this._addFeature(
      Object.assign({_featureType: TRACK_PLAYER_FEATURE_TYPE.TRACK_END, _type}, data[data.length - 1])
    );

    let trackActiveFeature = this._addFeature(
      Object.assign({_featureType: TRACK_PLAYER_FEATURE_TYPE.TRACK_ACTIVE, _type}, data[0])
    );

    this._data = data;
    _trackPlayerFeatureManager.showLayer();

    this.dispatch(TRACK_PLAYER_EVENT.TRACK_CHANGED, {
      trackLineFeature,
      trackStartFeature,
      trackEndFeature,
      trackActiveFeature
    });

  }

  /**
   * 添加要素，并返回要素对象
   * @param attributes
   * @returns {*}
   * @private
   */
  _addFeature(attributes) {
    let {_trackPlayerFeatureManager} = this;
    let featureId = _trackPlayerFeatureManager.addFeature(attributes).getFeatureId(attributes);
    return _trackPlayerFeatureManager.getFeatureById(featureId);
  }

  /**
   * 创建播放定时器
   * @returns {*}
   * @private
   */
  _createTimer() {
    return this._isForwardPlay() ? this._createForwardTimer() : this._createBackwardTimer();
  }

  /**
   * 判断是否为前进播放
   * @returns {boolean}
   * @private
   */
  _isForwardPlay() {
    return this._playType === TRACK_PLAYER_PLAY_TYPE.FORWARD;
  }

  /**
   * 判断是否为后退播放
   * @returns {boolean}
   * @private
   */
  _isBackwardPlay() {
    return this._playType === TRACK_PLAYER_PLAY_TYPE.BACKWARD;
  }

  /**
   * 创建前进播放定时器
   * @returns {number}
   * @private
   */
  _createForwardTimer() {
    return setInterval(() => {
      this.setIndex(this._index + 1);
    }, this._interval);
  }

  /**
   * 创建后退播放定时器
   * @returns {number}
   * @private
   */
  _createBackwardTimer() {
    return setInterval(() => {
      this.setIndex(this._index - 1);
    }, this._interval);
  }

  /**
   * 点击线段时将index设置为最近的一个点
   */
  _addMapEventListener() {
    let {_trackPlayerFeatureManager} = this;
    let map = _trackPlayerFeatureManager.getMap();
    let layer = _trackPlayerFeatureManager.getLayer()
    map.on(OL_EVENT.MAP_SINGLE_CLICK, e => {
      if(e[OL_EVENT_FLAG.INFO_WINDOW_OPENED]) {
        return;
      }
      map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
        //return true时不会再向下遍历
        let coordinates = map.getCoordinateFromPixel(e.pixel);
        this._setIndexByCoordinates(coordinates);
        e[OL_EVENT_FLAG.TRACK_PLAYER_INDEX_CHANGED] = true;
        return true;
      }, {
        layerFilter: _layer => {
          return _layer === layer;
        }
      });
    });
  }

  /**
   * 设置当前index为距离指定点最近的坐标
   * @param coordinates
   * @private
   */
  _setIndexByCoordinates(coordinates) {
    let projection = this._getProjection();
    coordinates = transform(coordinates, projection, PROJECTION.EPSG_4326);
    let {_data} = this, min = {distance: Number.MAX_VALUE, index: -1}, distance;
    for(let index = 0, length = _data.length; index < length; index++) {
      distance = getDistance(coordinates, _data[index]._coordinates4326);
      if(distance < min.distance) {
        min.distance = distance;
        min.index = index;
      }
    }
    this.setIndex(min.index);
  }

  /**
   *
   * @private
   */
  _getProjection() {
    return this.getFeatureManager().getMap().getView().getProjection();
  }

  /**
   * 处理多段轨迹，得到回放数据data
   * @param trackFeature
   * @param track
   * @param step
   * @returns {Array}
   * @private
   */
  _resolveTrackFeature(trackLineFeature, track, step) {
    let multiLineString = trackLineFeature.getGeometry();
    let data = [];
    for (let index = 0; index < track.length; index++) {
      this._resolveLineString(step, multiLineString.getLineString(index), track[index], data);
    }
    return data;
  }

  /**
   * 处理单段轨迹
   * @param step
   * @param lineString
   * @param track
   * @param data
   * @private
   */
  _resolveLineString(step, lineString, track, data) {
    if (step) {
      this._resolveLineStringWhileUsingStep(step, lineString, track, data);
    } else {
      this._resolveLineStringWhileNotUsingStep(lineString, track, data);
    }
  }

  /**
   * 不进行平滑处理
   * @param lineString
   * @param track
   * @param data
   * @private
   */
  _resolveLineStringWhileNotUsingStep(lineString, track, data) {
    let projection = this._getProjection(), coordinates = lineString.getCoordinates(), attributes, _index;
    for (let index = 0; index < coordinates.length; index++) {
      attributes = track[index];
      _index = Math.max(index, 1);

      attributes._rotation = GeoUtils.getRotation(coordinates[_index - 1], coordinates[_index]);
      attributes._coordinates = coordinates[index];
      attributes._coordinates4326 = transform(coordinates[index], projection, PROJECTION.EPSG_4326);
      data.push(attributes);
    }
  }

  /**
   * 平衡处理
   * @param step
   * @param lineString
   * @param track
   * @param data
   * @private
   */
  _resolveLineStringWhileUsingStep(step, lineString, track, data) {
    let projection = this._getProjection(), index = 0, surplus = 0, attributes, line, distance, coordinates;
    lineString.forEachSegment((start, end) => {
      attributes = track[index];
      attributes._rotation = GeoUtils.getRotation(start, end);

      line = new LineString([start, end]);
      distance = getLength(line, {projection});
      while (surplus < distance) {
        coordinates = line.getCoordinateAt(surplus / distance);
        data.push(
          Object.assign(
            {
              _coordinates: coordinates,
              _coordinates4326: transform(coordinates, projection, PROJECTION.EPSG_4326)
            },
            attributes
          )
        );
        surplus += step;
      }
      surplus -= distance;
      index++;
    });
    if (surplus > 0) {
      coordinates = line.getLastCoordinate();
      data.push(
        Object.assign(
          {
            _coordinates: coordinates,
            _coordinates4326: transform(coordinates, projection, PROJECTION.EPSG_4326)
          },
          attributes
        )
      );
    }
  }

  /**
   * 验证播放类型是否合法
   * @param playType
   * @returns {boolean}
   * @private
   */
  static __validPlayType(playType) {
    return playType === TRACK_PLAYER_PLAY_TYPE.FORWARD || playType === TRACK_PLAYER_PLAY_TYPE.FORWARD.BACKWARD;
  }

  /**
   * 静态函数实例化
   * @returns {TrackPlayer}
   */
  static newInstance(trackPlayerFeatureManager, interval = 50) {
    Assert.isTrue(trackPlayerFeatureManager, ERROR.INVALID_PARAMETER);
    return new TrackPlayer(trackPlayerFeatureManager, interval);
  }

  /**
   * 空的轨迹回放实例
   * @returns {TrackPlayer}
   */
  static emptyTrackPlayer() {
    return new TrackPlayer();
  }


  /**
   * 创建轨迹回放要素管理器
   * @param type
   * @param zIndex
   * @param trackLineFeatureManager
   * @param trackPointFeatureManager
   * @returns {FeatureManager}
   */
  static createTrackPlayerFeatureManager({
                                           type = defaultTrackPlayerFeatureManagerTypes.COMPOSE,
                                           zIndex = 999,
                                           trackLineFeatureManager,
                                           trackPointFeatureManager
                                         }) {
    return FeatureManager.compose({
      type,
      classify: function ({_featureType}) {
        return _featureType === TRACK_PLAYER_FEATURE_TYPE.TRACK_LINE ? trackLineFeatureManager.getType() : trackPointFeatureManager.getType();
      },
      featureManagers: [trackLineFeatureManager, trackPointFeatureManager]
    });
  }

  /**
   * 创建轨迹线要素管理器
   * @param type
   * @param coordinates
   * @param style
   * @returns {FeatureManager}
   */
  static createTrackLineFeatureManager({
                                         type = defaultTrackPlayerFeatureManagerTypes.LINE,
                                         coordinates = defaultCoordinatesFunction,
                                         style
                                       }) {
    return new FeatureManager({
      type,
      key: function ({_featureType}) {
        return _featureType;
      },
      geometry: function ({track}) {
        return new MultiLineString(track.map(item => item.map(coordinates)));
      },
      style
    });
  }

  /**
   * 创建轨迹点要素管理器
   * @param type
   * @param style
   * @param infoWindow
   * @returns {FeatureManager}
   */
  static createTrackPointFeatureManager({
                                          type = defaultTrackPlayerFeatureManagerTypes.POINT,
                                          style,
                                          infoWindow
                                        }) {
    return new FeatureManager({
      type,
      key: function ({_featureType}) {
        return _featureType;
      },
      geometry: function ({_coordinates}) {
        return new Point(_coordinates);
      },
      style,
      infoWindow
    });
  }

}

export default TrackPlayer;