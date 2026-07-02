<template>
  <view class="settings-page">
    <tn-nav-bar :isBack="true" :bottomShadow="false" backgroundColor="#FFFFFF">
      <view class="custom-nav">
        <text class="tn-text-bold tn-text-xl tn-color-black">设置</text>
      </view>
    </tn-nav-bar>

    <view :style="{paddingTop: vuex_custom_bar_height + 'px'}">
      <!-- 用户信息 -->
      <view class="settings-section">
        <view class="section-title">用户信息</view>
        <view class="setting-item">
          <text class="setting-label">头像</text>
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image class="avatar-img" :src="userAvatar" mode="aspectFill" />
            <text class="tn-icon-right tn-color-gray"></text>
          </button>
        </view>
        <view class="setting-item">
          <text class="setting-label">昵称</text>
          <input
            class="nickname-input"
            type="nickname"
            :value="userName"
            placeholder="请输入昵称"
            @blur="saveNickname"
            @confirm="saveNickname"
          />
        </view>
      </view>

      <!-- 网络设置（仅开发环境可见） -->
      <!-- #ifdef H5 -->
      <view class="settings-section">
        <view class="section-title">网络设置</view>
        <view class="setting-item">
          <text class="setting-label">当前网络模式</text>
          <view class="network-mode">
            <text>{{ networkLabel }}</text>
          </view>
        </view>
        <view class="setting-item">
          <text class="setting-label">API地址</text>
          <text class="setting-value-text">{{ apiBaseUrl }}</text>
        </view>
        <view class="setting-item">
          <text class="setting-label">媒体地址</text>
          <text class="setting-value-text">{{ mediaBaseUrl }}</text>
        </view>
        <view class="setting-item" @click="testNetwork">
          <text class="setting-label">重新检测网络</text>
          <text class="tn-icon-refresh tn-color-blue"></text>
        </view>
      </view>
      <!-- #endif -->

      <!-- 关于 -->
      <view class="settings-section">
        <view class="section-title">关于</view>
        <view class="setting-item">
          <text class="setting-label">版本</text>
          <text class="tn-color-gray">1.0.0</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import store from '@/nxTemp/store/index.js'

  const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="32" fill="%23F6D7C1"/%3E%3Ccircle cx="60" cy="46" r="22" fill="%23FFFFFF" fill-opacity=".9"/%3E%3Cpath d="M25 103c7-20 21-30 35-30s28 10 35 30" fill="%23FFFFFF" fill-opacity=".9"/%3E%3C/svg%3E'

  export default {
    data() {
      return {
        userName: '微信用户',
        userAvatar: DEFAULT_AVATAR
      }
    },
    computed: {
      networkLabel() {
        return store.getters.networkLabel || '检测中'
      },
      apiBaseUrl() {
        return store.getters.apiBaseUrl || ''
      },
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl || ''
      }
    },
    onLoad() {
      this.loadUserInfo()
    },
    methods: {
      loadUserInfo() {
        try {
          const userInfo = uni.getStorageSync('userInfo') || {}
          if (userInfo.nickName) this.userName = userInfo.nickName
          if (userInfo.avatarUrl) this.userAvatar = userInfo.avatarUrl
        } catch (e) {}
      },

      onChooseAvatar(event) {
        const avatarUrl = event?.detail?.avatarUrl
        if (!avatarUrl) return
        this.userAvatar = avatarUrl
        this.saveUserInfo()
      },

      saveNickname(e) {
        const value = e?.detail?.value || e?.detail
        if (value) {
          this.userName = value
          this.saveUserInfo()
        }
      },

      saveUserInfo() {
        try {
          const userInfo = uni.getStorageSync('userInfo') || {}
          userInfo.nickName = this.userName
          userInfo.avatarUrl = this.userAvatar
          uni.setStorageSync('userInfo', userInfo)
        } catch (e) {}
      },

      async testNetwork() {
        uni.showLoading({ title: '检测中...' })
        try {
          await store.dispatch('detectNetwork')
          uni.hideLoading()
          uni.showToast({ title: '检测完成', icon: 'success' })
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '检测失败', icon: 'none' })
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .settings-page {
    min-height: 100vh;
    background: #F8F8F8;
  }

  .custom-nav {
    text-align: center;
  }

  .settings-section {
    margin: 20rpx 30rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  }

  .section-title {
    padding: 24rpx 30rpx 16rpx;
    font-size: 26rpx;
    color: #909399;
    font-weight: 600;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 30rpx;
    border-bottom: 1rpx solid #F5F5F5;

    &:last-child {
      border-bottom: none;
    }
  }

  .setting-label {
    font-size: 30rpx;
    color: #303133;
  }

  .avatar-btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    line-height: 1;

    &::after {
      border: none;
    }
  }

  .avatar-img {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: #F6D7C1;
  }

  .nickname-input {
    flex: 1;
    text-align: right;
    font-size: 28rpx;
    color: #303133;
  }

  .setting-value-text {
    font-size: 26rpx;
    color: #909399;
    max-width: 400rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .network-mode {
    padding: 6rpx 16rpx;
    background: #E8FAEB;
    border-radius: 20rpx;
    color: #51CF66;
    font-size: 24rpx;
  }
</style>
