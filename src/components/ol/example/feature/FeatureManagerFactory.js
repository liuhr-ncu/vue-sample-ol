import {Point} from 'ol/geom';
import {Icon, Style} from 'ol/style';

import FeatureManager from "../../feature/FeatureManager";
import InfoWindow from "../../infoWindow/InfoWindow";
import {FEATURE_KEY, POSITIONING, ERROR} from "../../Constants";

import PersonInfoWindow from "../infoWindow/PersonInfoWindow";
import VehicleInfoWindow from "../infoWindow/VehicleInfoWindow"



const FeatureType = {
  PERSON: 'person',
  VEHICLE: 'vehicle',
  COMPOSE: 'compose'
};


const getStyleFunction = function (type) {
  const cache = {};
  return (feature) => {
    //这里演示了鼠标移动到覆盖物上及弹窗打开时使用sos.png，其他时候使用alarm.png、online.png、outline.png
    let active = feature.get(FEATURE_KEY.ACTIVE) || feature.get(FEATURE_KEY.HOVER);
    let {isAlarm, online} = feature.get(FEATURE_KEY.ATTRIBUTES);
    let key = `${type}_${active}_${isAlarm}_${online}`;
    let style = cache[key];
    if(!style) {
      style = cache[key] = [
        new Style({
          image: new Icon({
            rotation: 0,
            src: `./map/${type}/${active ? 'sos' : isAlarm === 1 ? 'alarm' : online === 0 ? 'online' : 'outline'}.png`
          })
        })
      ];
    }
    return style;
  }
};

class FeatureManagerFactory {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  static create(type, showInfoWindow = true) {
    switch (type) {
      case FeatureType.PERSON:
        return FeatureManagerFactory._createPerson(showInfoWindow);
      case FeatureType.VEHICLE:
        return FeatureManagerFactory._createVehicle(showInfoWindow);
      case FeatureType.COMPOSE:
        return FeatureManagerFactory._createCompose(showInfoWindow);
      default:
        throw new Error(ERROR.INVALID_PARAMETER);
    }
  }

  static _createPerson(showInfoWindow) {
    return new FeatureManager({
      type: FeatureType.PERSON,
      geometry: function (attributes) {
        let {lng, lat} = attributes;
        return new Point([lng, lat]);
      },
      style: getStyleFunction(FeatureType.PERSON),
      infoWindow: showInfoWindow ? InfoWindow.newInstance(PersonInfoWindow, [0, -10], POSITIONING.BOTTOM) : undefined
    });
  }

  static _createVehicle(showInfoWindow) {
    return new FeatureManager({
      type: FeatureType.VEHICLE,
      geometry: function (attributes) {
        let {lng, lat} = attributes;
        return new Point([lng, lat]);
      },
      style: getStyleFunction(FeatureType.VEHICLE),
      infoWindow: showInfoWindow ? InfoWindow.newInstance(VehicleInfoWindow, [0, -10]) : undefined
    });
  }

  static _createCompose(showInfoWindow) {
    let personFeatureManager = FeatureManagerFactory._createPerson(showInfoWindow);
    let vehicleFeatureManager = FeatureManagerFactory._createVehicle(showInfoWindow);
    return FeatureManager.compose({
      type: FeatureType.COMPOSE,
      classify: ({vehicleNo}) => {
        return vehicleNo ? FeatureType.VEHICLE : FeatureType.PERSON;
      },
      featureManagers: [personFeatureManager, vehicleFeatureManager]
    }).cluster(300);
  }

}

export {FeatureType, FeatureManagerFactory}