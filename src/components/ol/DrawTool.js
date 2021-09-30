import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text} from "ol/style";
import VectorSource from "ol/source/Vector";
import {Draw, Modify} from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import {getArea, getLength} from "ol/sphere";
import {Point} from "ol/geom";
import {fromCircle} from 'ol/geom/Polygon';
import Feature from "ol/Feature";
import {Assert} from "./CommonUtils";
import GeometryType from "ol/geom/GeometryType";
import {createBox, createRegularPolygon} from "ol/interaction/Draw";

const MEASURE_TYPE = {
    LENGTH: 'length',
    AREA: 'area',
    ALL: 'all',
    NONE: 'none'
}

const DRAW_TYPE = {
    POINT: 'point',
    LINE_STRING: 'lineString',
    RECTANGLE: 'rectangle',
    SQUARE: 'square',
    CIRCLE: 'circle',
    POLYGON: 'polygon'
}

const defaultDraws = {
    point: {
        drawType: DRAW_TYPE.POINT,
        measureType: MEASURE_TYPE.NONE,
        style: undefined
    },
    lineString: {
        drawType: DRAW_TYPE.LINE_STRING,
        measureType: MEASURE_TYPE.LENGTH,
        style: undefined
    },
    rectangle: {
        drawType: DRAW_TYPE.RECTANGLE,
        measureType: MEASURE_TYPE.AREA,
        style: undefined
    },
    square: {
        drawType: DRAW_TYPE.SQUARE,
        measureType: MEASURE_TYPE.AREA,
        style: undefined
    },
    circle: {
        drawType: DRAW_TYPE.CIRCLE,
        measureType: MEASURE_TYPE.AREA,
        style: undefined
    },
    polygon: {
        drawType: DRAW_TYPE.POLYGON,
        measureType: MEASURE_TYPE.AREA,
        style: undefined
    }
}

const defaultStyle = new Style({
    fill: new Fill({
        color: 'rgba(122,155,255,0.2)',
    }),
    stroke: new Stroke({
        color: 'rgba(0,85,255,1)',
        width: 3,
    }),
    image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
            color: 'rgba(0,85,255,1)',
        }),
        fill: new Fill({
            color: 'rgba(122,155,255,0.2)',
        }),
    }),
});

const defaultModifyStyle = new Style({
    image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
            color: 'rgba(0,85,255,1)',
        }),
        fill: new Fill({
            color: 'rgba(122,155,255,0.4)',
        }),
    }),
    text: new Text({
        text: '按住拖动修改绘制',
        font: '12px Calibri,sans-serif',
        fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
    }),
});

const defaultMeasureLabelStyle = new Style({
    text: new Text({
        font: '14px Calibri,sans-serif',
        fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [3, 3, 3, 3],
        textBaseline: 'bottom',
        offsetY: -15,
    }),
    image: new RegularShape({
        radius: 8,
        points: 3,
        angle: Math.PI,
        displacement: [0, 10],
        fill: new Fill({
            color: 'rgba(0, 0, 0, 0.7)',
        }),
    }),
});

/**
 * 绘制工具(画点、线、矩形、正方形、圆形、多边形)
 * 类型:点、线、矩形、正方形、圆形、多边形
 */
class DrawTool {

    /**
     * TODO 应提供绘制完毕、修改完毕的回调
     * @param draws
     * @param measureLabelStyle
     * @param modifyStyle
     * @param enableModify
     * @param enableMeasure
     * @param clearPrevious
     * @param zIndex
     * @param visible
     */
    constructor({
        draws = {},
        measureLabelStyle = defaultMeasureLabelStyle,
        modifyStyle = defaultModifyStyle,
        enableModify = true,
        enableMeasure = true,
        clearPrevious = true,
        zIndex = 999,
        visible = true
    }) {
        draws = Object.assign({}, defaultDraws, draws);
        let source = new VectorSource();
        let modify = new Modify({source, style: modifyStyle, hitDetection: true, snapToPointer: true});
        modify.setActive(enableModify);
        let _style = function(feature) {
            let drawKey = feature.get('drawKey');
            if (!drawKey) {
                return [defaultStyle];
            }
            let {drawType, measureType, style} = this._draws[drawKey];
            style || (style = defaultStyle);
            const styles = [style];
            let geometry = feature.getGeometry(), label;
            if (this._enableMeasure) {
                label = DrawTool._getMeasureLabel(geometry, drawType, measureType);
            }
            if (label) {
                let _measureLabelStyle = this._measureLabelStyle;
                const point = DrawTool._getMeasurePoint(geometry, drawType);
                _measureLabelStyle.setGeometry(point);
                _measureLabelStyle.getText().setText(label);
                styles.push(_measureLabelStyle);
            }
            return styles;
        }

        let layer = new VectorLayer({
            source,
            zIndex,
            visible,
            style: feature => {
                return _style.call(this, feature);
            }
        });

        this._source = source;
        this._modify = modify;
        this._layer = layer;
        this._style = _style;
        this._draw = undefined;
        this._map = undefined;

        this._draws = draws;
        this._measureLabelStyle = measureLabelStyle;
        this._modifyStyle = modifyStyle;
        this._enableModify = enableModify;
        this._enableMeasure = enableMeasure;
        this._clearPrevious = clearPrevious;

    }

    /**
     * 创建一个绘制工具
     * @returns {DrawTool}
     */
    static newInstance () {
        return new DrawTool({});
    }

    /**
     *
     * @param map
     * @returns {DrawTool}
     */
    usedTo (map) {
        Assert.isFalse(this._map, '绘制工具已被使用，不可再次使用');
        Assert.isTrue(map, '地图对象不能为空');
        map.addLayer(this._layer);
        map.addInteraction(this._modify);

        this._map = map;
        return this;
    }


    /**
     * 开启绘制
     * @param drawKey
     * @returns {DrawTool}
     */
    enableDraw(drawKey) {

        let {_draw, _source, _draws, _style, _modify, _modifyStyle, _map} = this, {drawType} = _draws[drawKey];
        Assert.isTrue(_map, "绘制工具未使用");

        _draw && _map.removeInteraction(_draw);
        let draw = new Draw(
            Object.assign(DrawTool._getDrawOptions(drawType), {
                source: _source,
                style: feature => {
                    return _style.call(this, feature);
                }
            })
        );
        draw.on('drawstart', ({feature}) => {
            feature.set('drawKey', drawKey);
            this._clearPrevious && _source.clear();
            this._enableModify && _modify.setActive(false);
        });
        draw.on('drawend', ({feature}) => {
            if (!this._enableModify) {
                return;
            }
            _modifyStyle.setGeometry(feature.getGeometry());
            _modify.setActive(true);
            _map.once('pointermove', () => {
                _modifyStyle.setGeometry(undefined);
            });
        });
        _map.addInteraction(draw);

        this._draw = draw;
        return this;
    }

    /**
     * 关闭绘制
     * @returns {DrawTool}
     */
    disableDraw() {
        let {_draw, _map} = this;
        Assert.isTrue(_map, "绘制工具未使用");

        _draw && _map.removeInteraction(_draw);
        this._draw = _draw;
        return this;
    }

    /**
     * 开启编辑
     * @returns {DrawTool}
     */
    enableModify() {
        this._enableModify = true;
        this._modify.setActive(true);
        return this;
    }

    /**
     * 关闭编辑
     * @returns {DrawTool}
     */
    disableModify() {
        this._enableModify = false;
        this._modify.setActive(false);
        return this;
    }

    /**
     * 开启测量
     * @returns {DrawTool}
     */
    enableMeasure() {
        this._enableMeasure = true;
        this._source.changed();
        return this;
    }

    /**
     * 关闭测量
     * @returns {DrawTool}
     */
    disableMeasure() {
        this._enableMeasure = false;
        this._source.changed();
        return this;
    }

    clearPrevious() {
        this._clearPrevious = true;
        return this;
    }

    keepPrevious() {
        this._clearPrevious = false;
        return this;
    }

    /**
     * 添加要素
     * @param drawKey
     * @param geometry
     * @returns {DrawTool}
     */
    addFeature({drawKey, geometry}) {
        typeof geometry === "function" && (geometry = geometry.call(null));
        const feature = new Feature({geometry});
        feature.set('drawKey', drawKey);
        this._source.addFeature(feature);
        return this;
    }

    /**
     * 清除绘制
     * @returns {DrawTool}
     */
    clear() {
        this._source.clear();
        return this;
    }

    static _getMeasurePoint(geometry, drawType) {
        switch (drawType) {
            case DRAW_TYPE.POINT:
                return geometry;
            case DRAW_TYPE.LINE_STRING:
                return new Point(geometry.getLastCoordinate());
            case DRAW_TYPE.RECTANGLE:
                return geometry.getInteriorPoint();
            case DRAW_TYPE.SQUARE:
                return geometry.getInteriorPoint();
            case DRAW_TYPE.CIRCLE:
                return new Point(geometry.getCenter());
            case DRAW_TYPE.POLYGON:
                return geometry.getInteriorPoint();
            default:
                throw new Error('意外的绘制类型: ' + drawType);
        }
    }

    static  _getDrawOptions(drawType) {
        switch (drawType) {
            case DRAW_TYPE.POINT:
                return {type: GeometryType.POINT};
            case DRAW_TYPE.LINE_STRING:
                return {type: GeometryType.LINE_STRING};
            case DRAW_TYPE.RECTANGLE:
                return {type: GeometryType.CIRCLE, geometryFunction: createBox()};
            case DRAW_TYPE.SQUARE:
                return {type: GeometryType.CIRCLE, geometryFunction: createRegularPolygon(4)};
            case DRAW_TYPE.CIRCLE:
                return {type: GeometryType.CIRCLE};
            case DRAW_TYPE.POLYGON:
                return {type: GeometryType.POLYGON};
            default:
                throw new Error('意外的绘制类型: ' + drawType);
        }
    }

    static _getMeasureLabel(geometry, drawType, measureType) {
        measureType || (measureType = MEASURE_TYPE.NONE)
        switch (measureType) {
            case MEASURE_TYPE.LENGTH:
                return DrawTool._getLength(geometry, drawType);
            case MEASURE_TYPE.AREA:
                return DrawTool._getArea(geometry, drawType);
            case MEASURE_TYPE.ALL:
                return DrawTool._getLength(geometry, drawType) + ', ' + DrawTool._getArea(geometry, drawType);
            case MEASURE_TYPE.NONE:
                return undefined;
            default:
                throw new Error('意外的测量类型: ' + measureType);
        }
    }

    static _getArea(geometry, drawType) {
        let area;
        switch (drawType) {
            case DRAW_TYPE.POINT:
                throw new Error('面积不可求: ' + drawType);
            case DRAW_TYPE.LINE_STRING:
                throw new Error('面积不可求: ' + drawType);
            case DRAW_TYPE.RECTANGLE:
                area = getArea(geometry);
                break;
            case DRAW_TYPE.SQUARE:
                area = getArea(geometry);
                break;
            case DRAW_TYPE.CIRCLE:
                area = getArea(fromCircle(geometry));
                break;
            case DRAW_TYPE.POLYGON:
                area = getArea(geometry);
                break;
            default:
                throw new Error('意外的绘制类型: ' + drawType);
        }
        let output;
        if (area > 10000) {
            output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
        } else {
            output = Math.round(area * 100) / 100 + ' m\xB2';
        }
        return '面积: ' + output;
    }

    static _getLength(geometry, drawType) {
        let length;
        switch (drawType) {
            case DRAW_TYPE.POINT:
                throw new Error('长度不可求: ' + drawType);
            case DRAW_TYPE.LINE_STRING:
                length = getLength(geometry);
                break;
            case DRAW_TYPE.RECTANGLE:
                length = getLength(geometry);
                break;
            case DRAW_TYPE.SQUARE:
                length = getLength(geometry);
                break;
            case DRAW_TYPE.CIRCLE:
                length = getLength(fromCircle(geometry));
                break;
            case DRAW_TYPE.POLYGON:
                length = getLength(geometry);
                break;
            default:
                throw new Error('意外的绘制类型: ' + drawType);
        }
        let output;
        if (length > 100) {
            output = Math.round((length / 1000) * 100) / 100 + ' km';
        } else {
            output = Math.round(length * 100) / 100 + ' m';
        }
        return '长度: ' + output;
    }

}


export {DrawTool, MEASURE_TYPE, DRAW_TYPE};
