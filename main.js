import App from './App'
import Vue from 'vue'
import nxTemp from "@/nxTemp";
import store from "@/nxTemp/store";
import TuniaoUI from 'tuniao-ui'

// 引入TuniaoUI提供的vuex简写方法
let vuexStore = require('@/nxTemp/store/$t.mixin.js')
// 引入TuniaoUI对小程序分享的mixin封装
let mpShare = require('tuniao-ui/libs/mixin/mpShare.js')

async function bootstrap() {
	Vue.config.productionTip = false
	App.mpType = 'app'
	Vue.use(TuniaoUI)
	Vue.use(nxTemp);
	
	Vue.mixin(vuexStore)
	Vue.mixin(mpShare)
	
	const app = new Vue({
	  store,
	  ...App
	})
	app.$mount()
}

bootstrap()