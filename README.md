# vue-sample-ol

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


#Openlayers地图组件封装说明文档

##一、地图组件使用示例

```vue
  <template>
    ...
    <div class="map-wrap">
      <ol-map :mapCreator="mapCreator" @mapReady="handleMapReady"/>
    </div>
    ...
  </template>
  
  <script>
    import 'ol/ol.css';
    import {Map, View} from 'ol';
    import OSM from 'ol/source/OSM';
    import TileLayer from 'ol/layer/Tile';
  
    
    import OlMap from "ol-plus/map/OlMap";
    
    export default {
      components: {OlMap},
      methods: {
        
        mapCreator(target) {
           return new Map({
              target,
              layers: [
                new TileLayer({
                  source: new OSM()
                })
              ],
              view: new View({
                center: [115.7771390590016, 40.305671723555804],
                zoom: 5
              })
           });
        },
        
        handleMapReady(featureManagerPool) {
          //地图初始化完毕后开始执行该方法
        }
        
      }
    }
    
  </script>
  
  <style scoped lang="less">
    .map-wrap {
      width: 100%;
      height: 100%;
    }
  </style>
```


##二、主要类说明


###1、FeatureManager
|方法名|传入参数|返回值|方法说明|
|:---:|:---:|:---:|:---:|
|addFeature|attributes &#124; [attributes]|FeatureManager|添加一个或多个要素|
|updateFeature|attributes &#124; [attributes]|FeatureManager|更新一个或多个要素|
|addOrUpdateFeature|attributes &#124; [attributes]|FeatureManager|添加或更新一个或多个要素|
|removeFeature|featureId &#124; [featureId] &#124; attributes &#124; [attributes] &#124; filterFunction|FeatureManager|移除一个或多个要素|
|showFeature|featureId &#124; [featureId] &#124; attributes &#124; [attributes] &#124; filterFunction|FeatureManager|显示一个或多个要素|
|hideFeature|featureId &#124; [featureId] &#124; attributes &#124; [attributes] &#124; filterFunction|FeatureManager|隐藏一个或多个要素|
|showLayer|-|FeatureManager|显示图层|
|hideLayer|-|FeatureManager|隐藏图层|
|clear|-|FeatureManager|清除所有要素|
|setSingleStyle|style &#124; styleFunction|FeatureManager|设置单要素样式|
|setClusterStyle|style &#124; styleFunction|FeatureManager|设置聚合要素样式|
|cluster|distance: 聚合距离, style: 聚合要素样式|FeatureManager|开启聚合|
|single|-|FeatureManager|取消聚合|
|forEachFeature|callbackFunction|-|遍历要素对象|
|getFeatures|-|[Feature]|获取所有要素|
|getFeatureById|featureId|[Feature]|根据要素id获取要素|
|getShowFeatureById|featureId|[Feature]|根据要素id获取显示的要素|
|getHideFeatureById|featureId|[Feature]|根据要素id获取隐藏的要素|
|getFeatureId|attributes|featureId|根据要素属性获取要素id|
|getGeometry|attributes|Geometry|根据要素属性获取要素几何图形|
|getType|-|type|获取要素管理器类型|
|getInfoWindowManager|-|InfoWindowManager|获取弹窗管理器|
|getInfoWindow|Feature|InfoWindow|获取弹窗配置对象|
|getMap|-|Map|获取地图对象|
|getSource|-|VectorSource|获取图层Source|
|getLayer|-|VectorLayer|获取图层Layer|
|isActive|-|boolean|判断要素管理器是否已激活|
|active|InfoWindowManager|FeatureManager|激活要素管理器|
|[static] compose|-|FeatureManager|组合多个要素管理器为一个新的要素管理器|

