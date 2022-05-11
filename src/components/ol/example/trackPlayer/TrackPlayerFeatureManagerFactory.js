import {Icon, Style, Stroke} from 'ol/style';


import TrackPlayer from "../../trackPlayer/TrackPlayer";
import FeatureManager from "../../feature/FeatureManager";
import InfoWindow from "../../infoWindow/InfoWindow";
import {FEATURE_KEY, ERROR} from "../../Constants";


import VehicleInfoWindow from "../infoWindow/VehicleInfoWindow";
import PersonInfoWindow from "../infoWindow/PersonInfoWindow";




class TrackPlayerFeatureManagerFactory {

  constructor() {
    throw new Error(ERROR.CANNOT_INSTANTIATE);
  }

  static create() {
    let trackLineFeatureManager = TrackPlayerFeatureManagerFactory._createTrackLineFeatureManager();
    let trackPointFeatureManager = TrackPlayerFeatureManagerFactory._createTrackPointFeatureManager();
    return TrackPlayer.createTrackPlayerFeatureManager({
      trackLineFeatureManager,
      trackPointFeatureManager
    });
  }

  static _createTrackLineFeatureManager() {
    const cache = {};
    return TrackPlayer.createTrackLineFeatureManager({
      style: function (feature, resolution) {
        let lineDashOffset = feature.get('lineDashOffset'), res = cache[lineDashOffset];
        if(!res) {
          res = cache[lineDashOffset] = [
            new Style({
              stroke: new Stroke({
                color: [25, 25, 255, 1],
                width: 4
              })
            }),
            new Style({
              stroke: new Stroke({
                color: [204, 204, 255, 1],
                width: 2,
                lineDash: [2, 7],
                lineDashOffset
              })
            })
          ];
        }
        return res;
      }
    });
  }

  static _createTrackPointFeatureManager() {
    const vehicleTrackPointFeatureManager = this._createVehicleTrackPointFeatureManager();
    const personTrackPointFeatureManager = this._createPersonTrackPointFeatureManager();
    return FeatureManager.compose({
      type: 'track_point',
      classify: function ({_type}) {
        return _type === 'vehicle' ? vehicleTrackPointFeatureManager.getType() : personTrackPointFeatureManager.getType();
      },
      featureManagers: [vehicleTrackPointFeatureManager, personTrackPointFeatureManager]
    });
  }

  static _createVehicleTrackPointFeatureManager() {
    const style = new Style({
      image: new Icon({
        src: './map/vehicle/online.png'
      })
    });
    return TrackPlayer.createTrackPointFeatureManager({
      type: 'vehicle_track_point',
      style: function (feature, resolution) {
        let attributes = feature.get(FEATURE_KEY.ATTRIBUTES);
        let {_rotation} = attributes;
        style.getImage().setRotation(_rotation);
        return style;
      },
      infoWindow: InfoWindow.newInstance(VehicleInfoWindow, [0, -10])
    });
  }

  static _createPersonTrackPointFeatureManager() {
    const style = new Style({
      image: new Icon({
        src: './map/person/online.png'
      })
    });
    return TrackPlayer.createTrackPointFeatureManager({
      type: 'person_track_point',
      style: function (feature, resolution) {
        let attributes = feature.get(FEATURE_KEY.ATTRIBUTES);
        let {_rotation} = attributes;
        style.getImage().setRotation(_rotation);
        return style;
      },
      infoWindow: InfoWindow.newInstance(PersonInfoWindow, [0, -10])
    });
  }


}

export default TrackPlayerFeatureManagerFactory;
