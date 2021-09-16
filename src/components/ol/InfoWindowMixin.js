import InfoWindowManager from './InfoWindowManager';

export const InfoWindowMixin = {
  props: {
    attributes: Object,
    shared: Object,
    manager: {
      required: true,
      type: InfoWindowManager
    }
  }
};
