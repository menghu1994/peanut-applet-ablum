<template>
  <view class="settings-page">
    <tn-nav-bar :isBack="true" :bottomShadow="false" backgroundColor="#FFFFFF">
      <view class="custom-nav">
        <text class="tn-text-bold tn-text-xl tn-color-black">&#35774;&#32622;</text>
      </view>
    </tn-nav-bar>

    <view :style="{ paddingTop: vuex_custom_bar_height + 'px' }">
      <view class="settings-section">
        <view class="section-title">&#29992;&#25143;&#20449;&#24687;</view>
        <view class="setting-item">
          <text class="setting-label">&#22836;&#20687;</text>
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image class="avatar-img" :src="userAvatar" mode="aspectFill" />
            <text class="tn-icon-right tn-color-gray"></text>
          </button>
        </view>
        <view class="setting-item">
          <text class="setting-label">&#26165;&#31216;</text>
          <input
            class="nickname-input"
            type="nickname"
            :value="userName"
            placeholder="&#35831;&#36755;&#20837;&#26165;&#31216;"
            @blur="saveNickname"
            @confirm="saveNickname"
          />
        </view>
      </view>

      <!-- #ifdef H5 -->
      <view class="settings-section">
        <view class="section-title">&#32593;&#32476;&#35774;&#32622;</view>
        <view class="setting-item">
          <text class="setting-label">&#24403;&#21069;&#32593;&#32476;&#27169;&#24335;</text>
          <view class="network-mode">
            <text>{{ networkLabel }}</text>
          </view>
        </view>
        <view class="setting-item">
          <text class="setting-label">API &#22320;&#22336;</text>
          <text class="setting-value-text">{{ apiBaseUrl }}</text>
        </view>
        <view class="setting-item">
          <text class="setting-label">&#23186;&#20307;&#22320;&#22336;</text>
          <text class="setting-value-text">{{ mediaBaseUrl }}</text>
        </view>
        <view class="setting-item" @tap="testNetwork">
          <text class="setting-label">&#37325;&#26032;&#26816;&#27979;&#32593;&#32476;</text>
          <text class="tn-icon-refresh tn-color-blue"></text>
        </view>
      </view>
      <!-- #endif -->

      <view class="settings-section">
        <view class="section-title">&#20851;&#20110;</view>
        <view class="setting-item">
          <text class="setting-label">&#29256;&#26412;</text>
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
        userName: '\u5fae\u4fe1\u7528\u6237',
        userAvatar: DEFAULT_AVATAR
      }
    },
    computed: {
      networkLabel() {
        return store.getters.networkLabel || '\u68c0\u6d4b\u4e2d'
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

      onChooseAvatar(event) {
        const avatarUrl = event && event.detail ? event.detail.avatarUrl : ''
        if (!avatarUrl) return
        this.userAvatar = avatarUrl
        this.saveUserInfo()
      },

      saveNickname(e) {
        const value = e && e.detail ? e.detail.value || e.detail : ''
        const nickName = typeof value === 'string' ? value.trim() : ''
        if (!nickName) return
        this.userName = nickName
        this.saveUserInfo()
      },

      saveUserInfo() {
        try {
          const stateUserInfo = store.state.userInfo || {}
          const cacheUserInfo = uni.getStorageSync('userInfo') || {}
          const userId = stateUserInfo.userId || cacheUserInfo.userId || uni.getStorageSync('photo_wechat_guest_user_id') || `guest_${Date.now()}`
          const nextUserInfo = {
            ...cacheUserInfo,
            ...stateUserInfo,
            userId,
            nickName: this.userName,
            avatarUrl: this.userAvatar
          }

          store.commit('setStateAttr', {
            key: 'userInfo',
            val: nextUserInfo
          })
          uni.setStorageSync('userInfo', nextUserInfo)
          uni.setStorageSync('photo_wechat_guest_user_id', userId)
        } catch (e) {}
      },

      async testNetwork() {
        uni.showLoading({ title: '\u68c0\u6d4b\u4e2d...' })
        try {
          await store.dispatch('detectNetwork')
          uni.hideLoading()
          uni.showToast({ title: '\u68c0\u6d4b\u5b8c\u6210', icon: 'success' })
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '\u68c0\u6d4b\u5931\u8d25', icon: 'none' })
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .settings-page {
    min-height: 100vh;
    background: #f8f8f8;
  }

  .custom-nav {
    text-align: center;
  }

  .settings-section {
    margin: 20rpx 30rpx;
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
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
    border-bottom: 1rpx solid #f5f5f5;

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
    background: #f6d7c1;
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
    background: #e8faeb;
    border-radius: 20rpx;
    color: #51cf66;
    font-size: 24rpx;
  }
</style>
