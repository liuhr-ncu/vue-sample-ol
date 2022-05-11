import Assert from "./Assert";

/**
 * 事件基础类(实现了事件注册、注销、触发)
 */
class EventRegistry {

  /**
   * 事件映射
   * @type {{}}
   * @private
   */
  _listeners = {};

  /**
   * 添加事件监听(多个事件传递数组或以逗号隔开)
   * @param type
   * @param listener
   * @returns {EventRegistry}
   */
  on(type, listener, once = false) {
    Assert.isTrue(type, "事件名不能为空");
    Assert.isTrue(listener, "回调函数不能为空");

    if(typeof type === 'string') {
      type = type.split(',');
    }

    const {_listeners} = this;
    type.forEach(_type => {
      if(!_type) {
        return;
      }
      let listeners = _listeners[_type];
      listeners || (listeners = []);
      _listeners[_type] = listeners.concat(EventRegistry._adjustListener(_type, listener, once));
    });

    return this;
  }

  /**
   * 添加一次事件监听(多个事件传递数组或以逗号隔开)
   * @param type
   * @param listener
   * @returns {EventRegistry}
   */
  once(type, listener) {
    return this.on(type, listener, true);
  }

  /**
   * 移除事件监听(多个事件传递数组或以逗号隔开)
   * @param type
   * @param listener
   * @returns {EventRegistry}
   */
  un(type, listener) {
    Assert.isTrue(type, "事件名不能为空");

    if(typeof type === 'string') {
      type = type.split(',');
    }

    let listenerFilter = _listener => _listener !== listener;
    if (Array.isArray(listener)) {
      listenerFilter = _listener => listener.indexOf(_listener) === -1;
    }

    const {_listeners} = this;
    type.forEach(_type => {
      if (listener === undefined) {
        delete _listeners[_type];
        return;
      }
      let listeners = _listeners[_type];
      listeners && (_listeners[_type] = listeners.filter(listenerFilter));
    });

    return this;
  }

  /**
   * 派遣某事件
   * @param type
   * @param data
   * @returns {EventRegistry}
   */
  dispatch(type, data) {
    Assert.isTrue(type, "请指定事件类型");
    let listeners = this._listeners[type];
    if(listeners) {
      let e = {type, data, target: this};
      for(let index in listeners) {
        if(listeners[index].call(this, e) === false || e.propagationStopped) {
          //阻止事件冒泡
          break;
        }
      }
    }
    return this;
  }


  /**
   * 调整事件
   * @param type
   * @param listener
   * @param once
   * @returns {*}
   * @private
   */
  static _adjustListener(type, listener, once = false) {
    if(once) {
      const originalListener = listener;
      listener = function () {
        this.un(type, listener);
        originalListener.apply(this, arguments);
      };
    }
    return listener;
  }

}

export default EventRegistry;