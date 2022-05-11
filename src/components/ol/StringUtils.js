import {CHARS, ERROR} from "./Constants";

class StringUtils {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  /**
   * 创建随机字符串
   * @param length
   * @param charSet
   * @returns {string}
   */
  random(length = 8, charSet = CHARS.DEFAULT) {
    let result = [];
    while (length--) {
      result.push(charSet[Math.floor(Math.random() * charSet.length)]);
    }
    return result.join('');
  }

}

export default StringUtils;