import {Assert} from "./CommonUtils";
import {LineString} from "ol/geom";

/**
 * 要素类型
 * @type {{track: string, point: string}}
 */
const DEFAULT_FEATURE_TYPE = { track: 'history_track', point: 'history_point' };

/**
 * 要素ID
 * @type {{ACTIVE: string, START: string, END: string, TRACK: string}}
 */
const FEATURE_ID = {TRACK: 'track', START: 'start', END: 'end', ACTIVE: 'active'};

/**
 * 播放类型
 * @type {{BACKWARD: string, FORWARD: string}}
 */
const PLAY_TYPE = {FORWARD: 'forward', BACKWARD: 'backward'};

class HistoryTrackPlayer {

    /**
     *
     * @param step 步长(默认50米, 若设置了该值，将平滑移动轨迹点, 设置为false时不进行平滑移动效果处理)
     * @param interval 定时器时间间隔(默认50ms)
     * @param featureType 要素管理器类型
     * @param featureManagerPool 要素管理器池
     */
    constructor({
        step = 50,
        interval = 50,
        featureType = DEFAULT_FEATURE_TYPE,
        featureManagerPool
    }) {
        this._step = step;
        this._interval = interval;
        this._featureType = featureType;
        this._featureManagerPool = featureManagerPool;
        Assert.isTrue(featureManagerPool, "要素管理器池不能为空");
        Assert.isTrue(featureManagerPool.has(featureType.track), "未找到轨迹线要素管理器");
        Assert.isTrue(featureManagerPool.has(featureType.point), "未找到轨迹点要素管理器");

        //
        this._data = [];
        this._index = 0;
        this._timer = undefined;
        this._type = undefined;
    }

    /**
     * 修改定时器间隔(控制播放速度)
     * @param interval
     */
    setInterval(interval) {
        this._interval = interval;
        this._timer && (this._type === PLAY_TYPE.FORWARD ? this.forwardPlay() : this.backwardPlay());
        return this;
    }

    /**
     * 销毁轨迹回放器
     * @returns {HistoryTrackPlayer}
     */
    destroy() {
        let {_featureManagerPool, _featureType} = this, trackFeatureManager = _featureManagerPool.get(_featureType.track), pointFeatureManager = _featureManagerPool.get(_featureType.point);
        //停止播放
        this.pause();
        //重置数据
        this._data = [];
        this._index = 0;
        //清空轨迹线、起点、终端、移动点
        trackFeatureManager.clear();
        pointFeatureManager.clear();
        return this;
    }

    /**
     * 设置轨迹数据
     * @param track  [[{},{},{},{}], [{},...{}] ..... [{},...{}]]
     * @private
     */
    setTrack(track) {
        this.destroy();
        Assert.isTrue((track instanceof Array) && track.length > 0, "轨迹数据格式错误");
        Assert.isTrue(track.every(e => (e instanceof Array) && e.length > 0), "轨迹数据格式错误");

        let {_featureManagerPool, _featureType} = this, trackFeatureManager = _featureManagerPool.get(_featureType.track), pointFeatureManager = _featureManagerPool.get(_featureType.point);

        //添加轨迹线
        trackFeatureManager.addFeature({track, _id: FEATURE_ID.TRACK});
        let trackFeature = trackFeatureManager.getFeatureById(FEATURE_ID.TRACK);
        let trackGeometry = trackFeature.getGeometry();
        let firstCoordinate = trackGeometry.getFirstCoordinate(), lastCoordinate = trackGeometry.getLastCoordinate();

        //添加起点、终点、移动的点
        let start = track[0], end = track[track.length-1];
        start = Object.assign({}, start[0], {_id: FEATURE_ID.START, _coordinate: firstCoordinate});
        end = Object.assign({}, end[end.length - 1], {_id: FEATURE_ID.END, _coordinate: lastCoordinate});
        let active = Object.assign({}, start, {_id: FEATURE_ID.ACTIVE, _coordinate: firstCoordinate});
        pointFeatureManager.addFeatures([start, end, active]);

        //计算回放时的移动数据
        this._parse(track);
        return this;
    }

    /**
     * 播放(前进)
     */
    forwardPlay() {
        this.pause();
        let index = this._index, options = {_data: this._data, pointFeatureManager: this._featureManagerPool.get(this._featureType.point), type: PLAY_TYPE.FORWARD};
        this._timer = setInterval(() => {
            this.setIndex(++index, options);
        }, this._interval);
        this._type = PLAY_TYPE.FORWARD;
        return this;
    }

    /**
     * 播放(后退)
     */
    backwardPlay() {
        this.pause();
        let index = this._index, options = {_data: this._data, pointFeatureManager: this._featureManagerPool.get(this._featureType.point), type: PLAY_TYPE.BACKWARD};
        this._timer = setInterval(() => {
            this.setIndex(--index, options);
        }, this._interval);
        this._type = PLAY_TYPE.BACKWARD;
        return this;
    }

    /**
     * 暂停
     */
    pause() {
        this._timer&&(clearInterval(this._timer), this._timer = false, this._type = undefined);
        return this;
    }

    /**
     * 前进
     */
    forward() {
        this.setIndex(this._index + 1);
        return this;
    }

    /**
     * 后退
     */
    backward() {
        this.setIndex(this._index - 1);
        return this;
    }

    /**
     * 跳转到指定index
     * @param index
     * @param _data
     * @param pointFeatureManager
     */
    setIndex(index, {_data = this._data, pointFeatureManager = this._featureManagerPool.get(this._featureType.point), type}) {
        index < 0 && (index = 0, type === PLAY_TYPE.BACKWARD && this.pause());
        index > _data.length - 1 && (index = _data.length - 1, type === PLAY_TYPE.FORWARD && this.pause());
        pointFeatureManager.addFeature(_data[index]);
        this._index = index;
        return this;
    }

    /**
     * 解析轨迹数据
     * @param _track
     * @private
     */
    _parse(_track) {
        let {_featureManagerPool, _featureType} = this, trackFeatureManager = _featureManagerPool.get(_featureType.track);
        let trackFeature = trackFeatureManager.getFeatureById(FEATURE_ID.TRACK);
        let trackGeometry = trackFeature.getGeometry();
        let data = [];
        for (let index = 0, length = _track.length; index < length; index++) {
            this._parseLineString(trackGeometry.getLineString(index), _track[index], data);
        }
        this._data = data;
    }

    /**
     *
     * @param lineString
     * @param track
     * @param data
     * @private
     */
    _parseLineString(lineString, track, data) {
        let { _step } = this;
        _step ? HistoryTrackPlayer._parseLineStringWhileUsingStep(_step, lineString, track, data) : HistoryTrackPlayer._parseLineStringWhileNotUsingStep(lineString, track, data);
    }

    /**
     * 不进行平滑处理
     * @param lineString
     * @param track
     * @param data
     * @private
     */
    static _parseLineStringWhileNotUsingStep(lineString, track, data) {
        let coordinates = lineString.getCoordinates(), attribute, _coordinate;
        for (let index = 0, length = coordinates.length; index < length; index++) {
            attribute = track[index];
            _coordinate = coordinates[index];
            data.push(Object.assign({}, attribute, {_id: FEATURE_ID.ACTIVE, _coordinate}));
        }
    }

    /**
     * 平滑处理数据
     * @param step
     * @param lineString
     * @param track
     * @param data
     * @private
     */
    static _parseLineStringWhileUsingStep(step, lineString, track, data) {
        let index = 0, surplus = 0, attribute, _coordinate;
        lineString.forEachSegment((start, end) => {
            attribute = track[index];
            let line = new LineString([start,  end]);
            let distance = line.getLength();
            while (surplus < distance) {
                _coordinate = line.getCoordinateAt(surplus/distance);
                data.push(Object.assign({}, attribute, {_id: FEATURE_ID.ACTIVE, _coordinate}));
                surplus += step;
            }
            surplus -= distance;
            index++;
        });
        attribute = track[index], _coordinate = lineString.getLastCoordinate();
        data.push(Object.assign({}, attribute, {_id: FEATURE_ID.ACTIVE, _coordinate}));
    }

}

export default HistoryTrackPlayer;
