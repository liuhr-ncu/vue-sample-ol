import {Assert} from './CommonUtils';

class FeatureManagerPool {

  /**
   *
   * @param map
   */
  constructor (map) {
    Assert.isTrue(map, '地图对象不能为空');
    this._map = map;
    this._managers = {};
  }

  /**
   *
   * @param map
   * @returns {FeatureManagerPool}
   */
  static newInstance (map) {
    return new FeatureManagerPool(map);
  }

  /**
   *
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
   *
   * @param type
   * @returns {*}
   */
  get (type) {
    return this._managers[type];
  }

  /**
   *
   * @param type
   * @returns {boolean}
   */
  has (type) {
    return type != undefined && this._managers[type] != undefined;
  }

  /**
   *
   * @returns {*}
   */
  getMap () {
    return this._map;
  }

  /**
   *
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
