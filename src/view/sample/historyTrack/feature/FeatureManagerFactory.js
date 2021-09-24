import FeatureManager from '@/components/ol/FeatureManager';
import {MultiLineString, Point} from 'ol/geom';

import InfoWindow from './InfoWindow';

import {Icon, Stroke, Style} from 'ol/style';

class FeatureManagerFactory {

  static createTrackManager () {
    let dashOffset = 0;
    let trackFeatureManager = new FeatureManager({
      type: 'history_track',
      key: attributes => attributes._id,
      geometry: ({track}) => {
        let coordinates = track.map(item => {
          return item.map(obj => [obj.lng, obj.lat]);
        });
        return new MultiLineString(coordinates);
      },
      style: feature => {
        return [
          new Style({
            stroke: new Stroke({
              color: [25, 25, 255, 1],
              width: 4,
            })
          }),
          new Style({
            stroke: new Stroke({
              color: [204, 204, 255, 1],
              width: 2,
              lineDash: [2, 7],
              lineDashOffset: dashOffset
            })
          })
        ];
      },
      cluster: false
    });
    //实现动态效果
    setInterval(function () {
      dashOffset = dashOffset == 0 ? 8 : dashOffset-1;
      //!!!重绘
      trackFeatureManager.changed();
    }, 100);
    return trackFeatureManager;
  }

  static createPointManager (manager) {
    return new FeatureManager({
      type: 'history_point',
      key: attributes => attributes._id,
      geometry: ({_coordinate}) => {
        return new Point(_coordinate);
      },
      infoWindow: {
        manager,
        template: InfoWindow,
        offset: feature => {
          let id = feature.getId();
          let offset = [0, -48];
          id === 'active' && (offset = [0, -60]);
          return offset;
        }
      },
      style: feature => {
        let id = feature.getId();
        let anchor = [0.5, 48];
        id === 'active' && (anchor = [0.5, 60]);
        return [
          new Style({
            image: new Icon({
              rotation: 0,
              src: `./assets/track/${id}.png`,
              anchorYUnits: 'pixels',
              anchor
            })
          })
        ]
      },
      cluster: false
    });
  }

}

export default FeatureManagerFactory;
