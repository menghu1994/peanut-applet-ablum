<template>
  <view class="page-e tn-safe-area-inset-bottom">
    <!-- 顶部自定义导航 -->
    <tn-nav-bar :isBack="false" :bottomShadow="false" backgroundColor="none">
      <view class="custom-nav tn-flex tn-flex-col-center tn-flex-row-left">
        <view class="custom-nav__back">
          <text class="tn-text-bold tn-text-xl tn-color-black">个人中心</text>
        </view>
      </view>
    </tn-nav-bar>

    <view :style="{paddingTop: vuex_custom_bar_height + 'px'}">
      <!-- 用户信息卡片 -->
      <view class="user-card" @click="goSettings">
        <view class="tn-flex tn-flex-col-center">
          <view class="user-avatar">
            <image :src="userAvatar" mode="aspectFill" class="avatar-image" />
          </view>
          <view class="user-info">
            <text class="user-name">{{ userName }}</text>
            <text class="user-desc">相册爱好者</text>
          </view>
          <view class="tn-icon-right tn-color-white" style="margin-left: auto;"></view>
        </view>
      </view>

      <!-- 功能列表 -->
      <view class="menu-section">
        <view class="menu-item" @click="openFavoriteTab">
          <view class="menu-icon tn-bg-red--light">
            <text class="tn-icon-heart tn-color-red"></text>
          </view>
          <text class="menu-text">我的收藏</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>

        <view class="menu-item" @click="goPage('/pageA/settings/settings')">
          <view class="menu-icon tn-bg-blue--light">
            <text class="tn-icon-set tn-color-blue"></text>
          </view>
          <text class="menu-text">设置</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>

        <view class="menu-item" @click="showNetworkInfo">
          <view class="menu-icon tn-bg-green--light">
            <text class="tn-icon-wifi tn-color-green"></text>
          </view>
          <text class="menu-text">网络状态</text>
          <view class="network-badge">
            <text class="tn-text-sm">{{ networkLabel }}</text>
          </view>
        </view>
      </view>

      <!-- 关于 -->
      <view class="menu-section">
        <view class="menu-item" @click="showAbout">
          <view class="menu-icon tn-bg-grey--light">
            <text class="tn-icon-info-circle tn-color-grey"></text>
          </view>
          <text class="menu-text">关于</text>
          <text class="tn-icon-right menu-arrow"></text>
        </view>
      </view>
    </view>

    <view class="tn-tabbar-height"></view>
  </view>
</template>

<script>
  import store from '@/nxTemp/store/index.js'

  export default {
    name: 'PageE',
    data() {
      return {
        userName: '相册用户',
        userAvatar: 'https://resource.tuniaokj.com/images/blogger/avatar_1.jpeg'
      }
    },
    computed: {
      networkLabel() {
        return store.getters.networkLabel || '检测中'
      }
    },
    created() {
      this.loadUserInfo()
    },
    methods: {
      loadUserInfo() {
        try {
          const userInfo = uni.getStorageSync('userInfo') || {}
          if (userInfo.nickName) {
            this.userName = userInfo.nickName
          }
          if (userInfo.avatarUrl) {
            this.userAvatar = userInfo.avatarUrl
          }
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

      showNetworkInfo() {
        const mode = store.state.networkMode
        const config = store.state.networkConfig[mode]
        uni.showModal({
          title: '网络信息',
          content: `当前模式: ${config.label}\nAPI地址: ${config.apiBaseUrl}\n媒体地址: ${config.mediaBaseUrl}`,
          showCancel: false
        })
      },

      showAbout() {
        uni.showModal({
          title: '关于',
          content: '相册展示应用 v1.0.0\n基于 baby-media 后端服务',
          showCancel: false
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-e {
    max-height: 100vh;
    background-color: #F8F8F8;
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
    border: 4rpx solid rgba(255,255,255,0.3);
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
    color: #FFFFFF;
  }

  .user-desc {
    display: block;
    font-size: 24rpx;
    color: rgba(255,255,255,0.8);
    margin-top: 8rpx;
  }

  .menu-section {
    margin: 20rpx 30rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #F5F5F5;

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
    color: #C0C4CC;
  }

  .network-badge {
    padding: 6rpx 16rpx;
    background: #E8FAEB;
    border-radius: 20rpx;
    color: #51CF66;
    font-size: 22rpx;
  }
</style>
