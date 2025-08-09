export default {
	// #ifdef MP-WEIXIN
	// 小程序更新
	checkMiniProgramUpdate() {
		if (uni.canIUse("getUpdateManager")) {
			const updateManager = uni.getUpdateManager();
			updateManager && updateManager.onCheckForUpdate((res) => {
				// 请求完新版本信息的回调
				if (res.hasUpdate) {
					updateManager.onUpdateReady(() => {
						uni.showModal({
							title: "更新提示",
							content: "新版本已经准备好，是否重启应用？",
							success: function(res) {
								if (res.confirm) {
									uni.clearStorageSync() // 更新完成后刷新storage的数据
									// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
									updateManager.applyUpdate();
								}
							}
						});
					});
					updateManager.onUpdateFailed(() => {
						// 新的版本下载失败
						uni.showModal({
							title: "已经有新版本了哟~",
							content: "新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~",
              howCancel: false
						});
					});
				}
			});
		}
	},
	// #endif

};
