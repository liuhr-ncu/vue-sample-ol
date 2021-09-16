/**
 *
 */
class Assert {

  /**
   *
   */
  constructor () {
    throw Errors.CAN_NOT_INSTANTIATE;
  }

  /**
   *
   * @param obj
   * @param error
   */
  static isTrue (obj, error) {
    if (!obj) {
      throw new Error(error);
    }
  }

  /**
   *
   * @param obj
   * @param error
   */
  static isFalse (obj, error) {
    if (obj) {
      throw new Error(error);
    }
  }

}

/**
 *
 */
class Optional {

  /**
   *
   * @param value
   */
  constructor (value) {
    this._value = value;
  }

  /**
   *
   * @returns {*}
   */
  get () {
    Assert.isTrue(this._value != undefined, '参数值为空');
    return this._value;
  }

  /**
   *
   * @returns {*}
   */
  isPresent () {
    return this._value;
  }

  /**
   *
   * @param mapper
   * @returns {Optional}
   */
  map (mapper) {
    Assert.isTrue(mapper != undefined, 'mapper不能为空');
    if (!this.isPresent()) {
      return Optional.empty();
    }
    return Optional.of(mapper.call(null, this._value));
  }

  /**
   *
   * @param other
   * @returns {*}
   */
  orElse (other) {
    return this._value != undefined ? this._value : other;
  }

  /**
   *
   * @returns {Optional}
   */
  static empty () {
    return EMPTY;
  }

  /**
   *
   * @param value
   * @returns {Optional}
   */
  static of (value) {
    return value != undefined ? new Optional(value) : EMPTY;
  }

}


const Errors = {
  CAN_NOT_INSTANTIATE: new Error('禁止实例化此类')
};

const EMPTY = new Optional();

export {Errors, Assert, Optional};
