<script>
  import Vue from 'vue'
  import store from '@/nxTemp/store/index.js'
  import updateCustomBarInfo from './tuniao-ui/libs/function/updateCustomBarInfo.js'
	import {init} from "@/nxTemp";
  
	export default {
		onLaunch(options) {
			// 检查小程序更新
			init(options);
			uni.getSystemInfo({
			  success: function(e) {
			    // #ifndef H5
			    // 获取手机系统版本
			    const system = e.system.toLowerCase()
			    const platform = e.platform.toLowerCase()
			    // 判断是否为ios设备
			    if (platform.indexOf('ios') != -1 && (system.indexOf('ios') != -1 || system.indexOf('macos') != -1)) {
			      Vue.prototype.SystemPlatform = 'apple'
			    } else if (platform.indexOf('android') != -1 && (system.indexOf('android') != -1)) {
			      Vue.prototype.SystemPlatform = 'android'
			    } else {
			      Vue.prototype.SystemPlatform = 'devtools'
			    }
			    // #endif
			  }
			})
      
      // 获取设备的状态栏信息和自定义顶栏信息
      // store.dispatch('updateCustomBarInfo')
      updateCustomBarInfo().then((res) => {
        store.commit('$tStore', {
          name: 'vuex_status_bar_height',
          value: res.statusBarHeight
        })
        store.commit('$tStore', {
          name: 'vuex_custom_bar_height',
          value: res.customBarHeight
        })
      })
		},
		onShow: function() {
			// console.log('App Show')
		},
		onHide: function() {
			// console.log('App Hide')
		}
	}
</script>

<style lang="scss">
  /* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
  @import './tuniao-ui/index.scss';
  @import './tuniao-ui/iconfont.css';
</style>
