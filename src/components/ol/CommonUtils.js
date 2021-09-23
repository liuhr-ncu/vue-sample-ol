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


const Errors = {
  CAN_NOT_INSTANTIATE: new Error('禁止实例化此类')
};

export {Errors, Assert};
