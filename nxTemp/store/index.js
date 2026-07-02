import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

let lifeData = {}

// 尝试获取本地是否存在lifeData变量，第一次启动时不存在
try {
  lifeData = uni.getStorageSync('lifeData')
} catch(e) {

}

// 标记需要永久存储的变量，在每次启动时取出，在state中的变量名
let saveStateKeys = ['vuex_user']

// 保存变量到本地存储
const saveLifeData = function(key, value) {
  if (saveStateKeys.indexOf(key) != -1) {
    let tmpLifeData = uni.getStorageSync('lifeData')
    tmpLifeData = tmpLifeData ? tmpLifeData : {},
    tmpLifeData[key] = value
    uni.setStorageSync('lifeData', tmpLifeData)
  }
}

// 导入网络模块
import * as networkModule from '../../store/modules/network.js'

const files = require.context("./modules", false, /\.js$/);
let modules = {
	state: {
		vuex_user: lifeData.vuex_user ? lifeData.vuex_user : {name: 'MYY'},
		vuex_version: "1.0.0",
		vuex_custom_nav_bar: true,
		vuex_status_bar_height: 0,
		vuex_custom_bar_height: 0,

		// 网络模块状态
		...networkModule.state
	},
	mutations: {
		$tStore(state, payload) {
		  let nameArr = payload.name.split('.')
		  let saveKey = ''
		  let len = nameArr.length
		  if (len >= 2) {
		    let obj = state[nameArr[0]]
		    for (let i= 1; i < len - 1; i++) {
		      obj = obj[nameArr[i]]
		    }
		    obj[nameArr[len - 1]] = payload.value
		    saveKey = nameArr[0]
		  } else {
		    state[payload.name] = payload.value
		    saveKey = payload.name
		  }
		  saveLifeData(saveKey, state[saveKey])
		},
		// 网络模块 mutations
		...networkModule.mutations
	},
	actions: {
		// 网络模块 actions
		...networkModule.actions
	},
	getters: {
		// 网络模块 getters
		...(networkModule.getters || {})
	}
};

files.keys().forEach((key) => {
  // 跳过 network.js，已经手动导入了
  if (key.includes('network')) return;
  Object.assign(modules.state, files(key)["state"]);
  Object.assign(modules.mutations, files(key)["mutations"]);
  Object.assign(modules.actions, files(key)["actions"]);
});
const store = new Vuex.Store(modules);
export default store;
