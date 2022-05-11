import {ANGLE_UNIT, ERROR} from "./Constants";

/**
 * 各个角度单位转换系数
 * @type {{deg: number, grad: number, turn: number, rad: number}}
 */
const transformMap = {deg: 360, grad: 400, turn: 1, rad: 2 * Math.PI};

/**
 *
 */
class CssUtils {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  /**
   * 角度转换
   * @param angle
   * @param unit
   * @returns {{number: number, unit: string}}
   */
  static transformAngle(angle, unit = ANGLE_UNIT.RAD) {
    let _angle = CssUtils._parseAngle(angle);
    let number = _angle.number * transformMap[unit] / transformMap[_angle.unit];
    return {number, unit};
  }

  /**
   * 解析角度
   * @param angle
   * @returns {{number: string, unit: string}}
   * @private
   */
  static _parseAngle(angle) {
    if(angle.endsWith(ANGLE_UNIT.DEG)) {
      return {number: angle.substring(0, angle.length - 3), unit: ANGLE_UNIT.DEG};
    }
    if(angle.endsWith(ANGLE_UNIT.GRAD)) {
      return {number: angle.substring(0, angle.length - 4), unit: ANGLE_UNIT.GRAD};
    }
    if(angle.endsWith(ANGLE_UNIT.TURN)) {
      return {number: angle.substring(0, angle.length - 4), unit: ANGLE_UNIT.TURN};
    }
    if(angle.endsWith(ANGLE_UNIT.RAD)) {
      return {number: angle.substring(0, angle.length - 3), unit: ANGLE_UNIT.RAD};
    }
    throw new Error(ERROR.INVALID_PARAMETER);
  }

}

export default CssUtils;