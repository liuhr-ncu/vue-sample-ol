import {ERROR} from "./Constants";

/**
 * 断言工具
 */
class Assert {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  /**
   * 断言值为真
   * @param obj
   * @param error
   */
  static isTrue(obj, error) {
    if (!obj) {
      throw new Error(error);
    }
  }

  /**
   * 断言值为假
   * @param obj
   * @param error
   */
  static isFalse(obj, error) {
    if (obj) {
      throw new Error(error);
    }
  }

}

export default Assert;