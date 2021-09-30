import {Assert} from './CommonUtils';

class FeatureManagerPool {

  /**
   * 要素管理器池构造函数
   * @param map
   */
  constructor (map) {
    Assert.isTrue(map, '地图对象不能为空');
    this._map = map;
    this._managers = {};
  }

  /**
   * 创建一个要素管理器池
   * @param map
   * @returns {FeatureManagerPool}
   */
  static newInstance (map) {
    return new FeatureManagerPool(map);
  }

  /**
   * 添加要素管理器
   * @param featureManager
   * @returns {FeatureManagerPool}
   */
  add (featureManager) {
    Assert.isFalse(featureManager.isUsed(), '要素管理器已使用');
    let {_map, _managers} = this;
    _managers[featureManager._usedTo(_map).getType()] = featureManager;
    return this;
  }

  /**
   * 获取某类要素管理器
   * @param type
   * @returns {*}
   */
  get (type) {
    return this._managers[type];
  }

  /**
   * 判断是否已有某类要素管理器
   * @param type
   * @returns {boolean}
   */
  has (type) {
    return type != undefined && this._managers[type] != undefined;
  }

  /**
   * 获取地图
   * @returns {*}
   */
  getMap () {
    return this._map;
  }

  /**
   * 只显示某类要素
   * @param type
   */
  onlyShow (type) {
    let {_managers} = this;
    for (let _type in _managers) {
      _managers[_type][_type === type ? 'show' : 'hide']();
    }
  }

}

export default FeatureManagerPool;
