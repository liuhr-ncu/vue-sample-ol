import FeatureManager from '@/components/ol/FeatureManager';
import {Point} from 'ol/geom';

import PersonInfoWindow from './person/InfoWindow';
import PlatInfoWindow from './plat/InfoWindow';
import ShipInfoWindow from './ship/InfoWindow';

import {Icon, Style} from 'ol/style';

const FEATURE_TYPE = {
  PERSON: 'person',
  PLAT: 'plat',
  SHIP: 'ship'
};

const commonStyle = function (feature) {
  let attributes = this.getAttributesById(feature.getId());
  let type = this.getType();
  let {alarm, online} = attributes;
  return [
    new Style({
      image: new Icon({
        rotation: 0,
        src: `./assets/feature/${type}/${alarm ? 'alarm' : (online ? 'online' : 'outline')}.png`,
        anchorYUnits: 'pixels',
        anchor: [0.5, 47]
      })
    })
  ];
};

class FeatureManagerFactory {
  static create (type, manager) {
    switch (type) {
      case FEATURE_TYPE.PERSON:
        return FeatureManagerFactory._createPerson(manager);
      case FEATURE_TYPE.PLAT:
        return FeatureManagerFactory._createPlat(manager);
      case FEATURE_TYPE.SHIP:
        return FeatureManagerFactory._createShip(manager);
      default:
        throw new Error('参数错误');
    }
  }

  static _createPerson (manager) {
    return new FeatureManager({
      type: 'person',
      geometry: attributes => {
        let {lng, lat} = attributes;
        return new Point([lng, lat]);
      },
      infoWindow: {
        manager,
        template: PersonInfoWindow,
        offset: [0, -45]
      },
      style: commonStyle,
      cluster: false
    });
  }

  static _createPlat (manager) {
    return new FeatureManager({
      type: 'plat',
      geometry: attributes => {
        let {lng, lat} = attributes;
        return new Point([lng, lat]);
      },
      infoWindow: {
        manager,
        template: PlatInfoWindow,
        offset: [0, -45]
      },
      style: commonStyle
    });
  }

  static _createShip (manager) {
    return new FeatureManager({
      type: 'ship',
      geometry: attributes => {
        let {lng, lat} = attributes;
        return new Point([lng, lat]);
      },
      infoWindow: {
        manager,
        template: ShipInfoWindow,
        offset: [0, -45]
      },
      style: commonStyle
    });
  }

}

export default FeatureManagerFactory;
