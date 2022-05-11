import Assert from "../Assert";


/**
 * 要素管理器池，提供要素管理器的添加、获取等功能
 */
class FeatureManagerPool {

  /**
   * 弹窗管理器
   */
  _infoWindowManager;

  /**
   * 要素管理器映射
   * @type {{}}
   * @private
   */
  _featureManagerMap = {};

  constructor(infoWindowManager) {
    Assert.isTrue(infoWindowManager, "弹窗对象不能为空");
    this._infoWindowManager = infoWindowManager;
  }

  /**
   * 添加要素管理器
   * @param featureManager
   * @returns {FeatureManagerPool}
   */
  add(featureManager) {
    if (Array.isArray(featureManager)) {
      featureManager.forEach(fm => this.add(fm));
      return this;
    }
    let type = featureManager.getType();
    Assert.isTrue(!this.has(type), "错误!要素类型[" + type + "]已存在");
    this._featureManagerMap[type] = featureManager.active(this._infoWindowManager);
    return this;
  }

  /**
   * 根据类型获取要素管理器
   * @param type
   * @returns {*}
   */
  get(type) {
    return this._featureManagerMap[type];
  }

  /**
   * 判断是否包含某要素管理器
   * @param type
   * @returns {*|boolean}
   */
  has(type) {
    return type && this._featureManagerMap[type] !== undefined;
  }

  /**
   * 获取弹窗管理器
   * @returns {*}
   */
  getInfoWindowManager() {
    return this._infoWindowManager;
  }

  getMap() {
    return this._infoWindowManager.getMap();
  }

  /**
   *
   * @param infoWindowManager
   * @returns {FeatureManagerPool}
   */
  static newInstance(infoWindowManager) {
    return new FeatureManagerPool(infoWindowManager);
  }

}

export default FeatureManagerPool;