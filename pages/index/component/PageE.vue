<template>
  <view class="page-e tn-safe-area-inset-bottom">
    <tn-nav-bar :isBack="false" :bottomShadow="false" backgroundColor="none">
      <view class="custom-nav tn-flex tn-flex-col-center tn-flex-row-left">
        <view class="custom-nav__back">
          <text class="tn-text-bold tn-text-xl tn-color-black">&#20010;&#20154;&#20013;&#24515;</text>
        </view>
      </view>
    </tn-nav-bar>

    <view :style="{ paddingTop: vuex_custom_bar_height + 'px' }">
      <view class="user-card" @tap="goSettings">
        <view class="tn-flex tn-flex-col-center">
          <view class="user-avatar">
            <image :src="userAvatar" mode="aspectFill" class="avatar-image" />
          </view>
          <view class="user-info">
            <text class="user-name">{{ userName }}</text>
            <text class="user-desc">&#30456;&#20876;&#29233;&#22909;&#32773;</text>
          </view>
          <view class="tn-icon-right tn-color-white" style="margin-left: auto;"></view>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-item" @tap="openFavoriteTab">
          <view class="menu-icon tn-bg-red--light">
            <text class="tn-icon-star tn-color-red"></text>
          </view>
          <text class="menu-text">&#25105;&#30340;&#25910;&#34255;</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>

        <view class="menu-item" @tap="goPage('/pageA/settings/settings')">
          <view class="menu-icon tn-bg-blue--light">
            <text class="tn-icon-set tn-color-blue"></text>
          </view>
          <text class="menu-text">&#35774;&#32622;</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>

        <view class="menu-item" @tap="showNetworkInfo">
          <view class="menu-icon tn-bg-green--light">
            <text class="tn-icon-wifi tn-color-green"></text>
          </view>
          <text class="menu-text">&#32593;&#32476;&#29366;&#24577;</text>
          <view class="network-badge">
            <text class="tn-text-sm">{{ networkLabel }}</text>
          </view>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-item" @tap="showAbout">
          <view class="menu-icon tn-bg-grey--light">
            <text class="tn-icon-safe tn-color-grey"></text>
          </view>
          <text class="menu-text">&#20851;&#20110;</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>
      </view>
    </view>

    <view class="tn-tabbar-height"></view>
  </view>
</template>

<script>
  import store from '@/nxTemp/store/index.js'

  const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="32" fill="%23F6D7C1"/%3E%3Ccircle cx="60" cy="46" r="22" fill="%23FFFFFF" fill-opacity=".9"/%3E%3Cpath d="M25 103c7-20 21-30 35-30s28 10 35 30" fill="%23FFFFFF" fill-opacity=".9"/%3E%3C/svg%3E'

  export default {
    name: 'PageE',
    data() {
      return {
        userName: '\u5fae\u4fe1\u7528\u6237',
        userAvatar: DEFAULT_AVATAR
      }
    },
    computed: {
      networkLabel() {
        return store.getters.networkLabel || '\u68c0\u6d4b\u4e2d'
      }
    },
    created() {
      this.loadUserInfo()
    },
    activated() {
      this.loadUserInfo()
    },
    methods: {
      loadUserInfo() {
        try {
          const stateUserInfo = store.state.userInfo || {}
          const cacheUserInfo = uni.getStorageSync('userInfo') || {}
          const userInfo = {
            ...cacheUserInfo,
            ...stateUserInfo
          }

          this.userName = userInfo.nickName || '\u5fae\u4fe1\u7528\u6237'
          this.userAvatar = userInfo.avatarUrl || DEFAULT_AVATAR
        } catch (e) {}
      },

      goPage(url) {
        uni.navigateTo({ url })
      },

      openFavoriteTab() {
        this.$emit('change-tab', 2)
      },

      goSettings() {
        uni.navigateTo({ url: '/pageA/settings/settings' })
      },

      isDevEnvironment() {
        try {
          // #ifdef MP-WEIXIN
          const accountInfo = wx.getAccountInfoSync()
          if (accountInfo && accountInfo.miniProgram) {
            return accountInfo.miniProgram.envVersion !== 'release'
          }
          // #endif
        } catch (e) {}

        return process.env.NODE_ENV !== 'production'
      },

      showNetworkInfo() {
        const mode = store.state.networkMode
        const config = store.state.networkConfig[mode] || {}
        const lines = [`\u5f53\u524d\u6a21\u5f0f: ${config.label || this.networkLabel}`]

        if (this.isDevEnvironment()) {
          lines.push(`API \u5730\u5740: ${config.apiBaseUrl || '-'}`)
          lines.push(`\u5a92\u4f53\u5730\u5740: ${config.mediaBaseUrl || '-'}`)
        } else {
          lines.push('\u5177\u4f53\u5730\u5740\u4ec5\u5728\u5f00\u53d1\u73af\u5883\u663e\u793a')
        }

        uni.showModal({
          title: '\u7f51\u7edc\u4fe1\u606f',
          content: lines.join('\n'),
          showCancel: false
        })
      },

      showAbout() {
        uni.showModal({
          title: '\u5173\u4e8e',
          content: '\u76f8\u518c\u5c55\u793a\u5e94\u7528 v1.0.0\n\u57fa\u4e8e baby-media \u540e\u7aef\u670d\u52a1',
          showCancel: false
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-e {
    max-height: 100vh;
    background-color: #f8f8f8;
  }

  .custom-nav {
    height: 100%;

    &__back {
      margin: auto 30rpx;
    }
  }

  .tn-tabbar-height {
    min-height: 20rpx;
    height: calc(40rpx + env(safe-area-inset-bottom) / 2);
    height: calc(40rpx + constant(safe-area-inset-bottom));
  }

  .user-card {
    margin: 30rpx;
    padding: 40rpx 30rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20rpx;
    box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.3);
  }

  .user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    overflow: hidden;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
  }

  .user-info {
    margin-left: 30rpx;
  }

  .user-name {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #ffffff;
  }

  .user-desc {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
  }

  .menu-section {
    margin: 20rpx 30rpx;
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }
  }

  .menu-icon {
    width: 70rpx;
    height: 70rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
  }

  .menu-text {
    flex: 1;
    margin-left: 24rpx;
    font-size: 30rpx;
    color: #303133;
  }

  .menu-arrow {
    font-size: 28rpx;
    color: #c0c4cc;
  }

  .network-badge {
    padding: 6rpx 16rpx;
    background: #e8faeb;
    border-radius: 20rpx;
    color: #51cf66;
    font-size: 22rpx;
  }
</style>
