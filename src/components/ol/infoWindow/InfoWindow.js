import Assert from "../Assert";
import {POSITIONING, ERROR} from "../Constants";

/**
 *
 * @type {number[]}
 */
const defaultOffset = [0, 0];

/**
 * 弹窗配置对象
 */
class InfoWindow {

  /**
   * 要素弹窗模板
   */
  _template;

  /**
   * 弹窗偏移
   */
  _offset;

  /**
   * 弹窗相对要素位置
   */
  _positioning;

  constructor(template, offset = defaultOffset, positioning = POSITIONING.TOP) {
    Assert.isTrue(template, "模板不能为空");
    this._template = template;
    this._offset = offset;
    this._positioning = positioning;
  }

  /**
   *
   * @returns {*}
   */
  template() {
    return this._template;
  }

  /**
   *
   * @returns {*[]}
   */
  offset() {
    return this._adjustOffset();
  }

  /**
   *
   * @returns {*}
   */
  positioning() {
    return this._positioning;
  }

  /**
   * 调整offset
   * @returns {*[]}
   * @private
   */
  _adjustOffset() {
    let {_offset, _positioning} = this;
    let offset = [..._offset];
    switch (_positioning) {
      case POSITIONING.TOP:
        offset[1] -= 20;
        break;
      case POSITIONING.BOTTOM:
        offset[1] += 20;
        break;
      case POSITIONING.LEFT:
        offset[0] -= 20;
        break;
      case POSITIONING.RIGHT:
        offset[0] += 20;
        break;
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
    return offset;
  }

  /**
   *
   * @param template
   * @param offset
   * @param positioning
   * @returns {InfoWindow}
   */
  static newInstance(template, offset = defaultOffset, positioning = POSITIONING.TOP) {
    return new InfoWindow(template, offset, positioning);
  }

}

export default InfoWindow;