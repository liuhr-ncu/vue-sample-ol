// 配置路由相关的信息
import VueRouter from 'vue-router'
import Vue from 'vue'

import draw from "../components/ol/example/draw/Example";
import feature from "../components/ol/example/feature/Example";
import infoWindow from "../components/ol/example/infoWindow/Example";
import trackPlayer from "../components/ol/example/trackPlayer/Example";
import mapLockstep from "../components/ol/example/mapLockstep/Example";

// 1.通过Vue.use(插件), 安装插件
Vue.use(VueRouter)

// 2.创建VueRouter对象
const routes = [
    {
        path: '',
        // redirect重定向
        redirect: '/draw'
    },
    {
        path: '/draw',
        component: draw
    },
    {
        path: '/feature',
        component: feature
    },
    {
        path: '/infoWindow',
        component: infoWindow
    },
    {
        path: '/trackPlayer',
        component: trackPlayer
    },
    {
        path: '/mapLockstep',
        component: mapLockstep
    }
]
const router = new VueRouter({
    // 配置路由和组件之间的应用关系
    routes,
    mode: 'history',
    linkActiveClass: 'active'
})

// 3.将router对象传入到Vue实例
export default router
