<template>
  <view class="favorite-viewer">
    <tn-nav-bar fixed alpha customBack>
      <view slot="back" class="tn-custom-nav-bar__back" @click="goBack">
        <text class="icon tn-icon-left"></text>
        <text class="icon tn-icon-home-capsule-fill"></text>
      </view>
    </tn-nav-bar>

    <view v-if="favoriteList.length" class="favorite-stage" :style="stageStyle">
      <view class="swiper-shell" :style="{ height: swiperHeight }">
        <tn-stack-swiper
          :list="swiperList"
          direction="vertical"
          height="100%"
          :switchRate="20"
          :scaleRate="0.05"
          :translateRate="7.2"
          @change="onSwiperChange"
        ></tn-stack-swiper>
      </view>
    </view>

    <view v-if="currentFavorite" class="floating-action button-unfavorite" @tap="removeFavorite(currentFavorite)">
      <view class="icon15__item--icon tn-flex tn-flex-row-center tn-flex-col-center tn-shadow-blur">
        <view class="tn-icon-like-fill"></view>
      </view>
    </view>

    <view v-else class="empty-state">
      <view class="empty-icon tn-flex tn-flex-row-center tn-flex-col-center">
        <text class="tn-icon-like"></text>
      </view>
      <text class="empty-title">还没有收藏</text>
      <text class="empty-desc">返回首页挑几张喜欢的吧</text>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList, removeFavorite as apiRemoveFavorite } from '@/api/modules/favorite.js'
  import store from '@/nxTemp/store/index.js'
  import { resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    data() {
      return {
        favoriteList: [],
        currentIndex: 0,
        initialIndex: 0,
        swiperContainerHeight: 0,
        stagePaddingTop: 0,
        stagePaddingBottom: 0
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      },
      swiperList() {
        return this.favoriteList.map((item) => ({
          ...item,
          image: this.getImageUrl(item.displayUrl || item.url || item.resourceCover)
        }))
      },
      currentFavorite() {
        if (!this.favoriteList.length) return null
        return this.favoriteList[this.currentIndex] || this.favoriteList[0]
      },
      swiperHeight() {
        return this.swiperContainerHeight ? `${this.swiperContainerHeight}px` : '72vh'
      },
      stageStyle() {
        return {
          paddingTop: `${this.stagePaddingTop}px`,
          paddingBottom: `${this.stagePaddingBottom}px`
        }
      }
    },
    onLoad(options) {
      const nextIndex = Number(options && options.index)
      this.initialIndex = Number.isNaN(nextIndex) ? 0 : Math.max(nextIndex, 0)
      this.fetchFavorites()
    },
    onShow() {
      if (this.favoriteList.length) {
        this.fetchFavorites()
      }
    },
    onReady() {
      this.$nextTick(() => {
        this.initSwiperContainer()
      })
    },
    methods: {
      goBack() {
        uni.navigateBack({
          delta: 1,
          fail: () => {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }
        })
      },

      initSwiperContainer() {
        const systemInfo = uni.getSystemInfoSync()
        const safeHeight = systemInfo.safeArea ? systemInfo.safeArea.height : systemInfo.windowHeight
        const safeTop = systemInfo.safeAreaInsets ? systemInfo.safeAreaInsets.top : 0
        const safeBottom = systemInfo.safeAreaInsets ? systemInfo.safeAreaInsets.bottom : 0
        this.stagePaddingTop = (this.vuex_custom_bar_height || safeTop + 88) + 24
        this.stagePaddingBottom = safeBottom + 140
        this.swiperContainerHeight = Math.max(safeHeight - this.stagePaddingTop, 420)
      },

      getImageUrl(cover) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, cover)
      },

      normalizeFavorites(list) {
        if (!Array.isArray(list) || !list.length) return []
        if (!this.initialIndex) return list
        const safeIndex = Math.min(this.initialIndex, list.length - 1)
        return [...list.slice(safeIndex), ...list.slice(0, safeIndex)]
      },

      async fetchFavorites() {
        try {
          const res = await getFavoriteList({ resourceType: 'album' })
          if (res.code === 0) {
            this.favoriteList = this.normalizeFavorites(res.data || [])
            if (this.currentIndex >= this.favoriteList.length) {
              this.currentIndex = this.favoriteList.length > 0 ? this.favoriteList.length - 1 : 0
            }
            this.initialIndex = 0
          }
        } catch (e) {
          console.error('获取收藏列表失败:', e)
        }
      },

      onSwiperChange(event) {
        const nextIndex = Number(event && event.index)
        if (!Number.isNaN(nextIndex)) {
          this.currentIndex = nextIndex
        }
      },

      async removeFavorite(item) {
        uni.showModal({
          title: '提示',
          content: '确定取消收藏吗？',
          success: async (res) => {
            if (!res.confirm) return

            try {
              const result = await apiRemoveFavorite(item.id)
              if (result.code === 0) {
                uni.showToast({ title: '已取消收藏', icon: 'success' })
                await this.fetchFavorites()
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .favorite-viewer {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #0f1115;
  }

  .tn-custom-nav-bar__back {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    box-sizing: border-box;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 1000rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.5);
    color: #ffffff;
    font-size: 18px;

    .icon {
      display: block;
      flex: 1;
      margin: auto;
      text-align: center;
    }

    &:before {
      content: '';
      width: 1rpx;
      height: 110%;
      position: absolute;
      top: 22.5%;
      left: 0;
      right: 0;
      margin: auto;
      transform: scale(0.5);
      transform-origin: 0 0;
      pointer-events: none;
      box-sizing: border-box;
      opacity: 0.7;
      background-color: #ffffff;
    }
  }

  .favorite-stage {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    padding-left: 28rpx;
    padding-right: 28rpx;
    box-sizing: border-box;
  }

  .swiper-shell {
    width: 100%;
    max-width: 694rpx;
    margin: 0 auto;
    border-radius: 36rpx;
    overflow: hidden;
    box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.28);
  }

  .floating-action {
    position: fixed;
    right: 30rpx;
    bottom: calc(36rpx + env(safe-area-inset-bottom));
    z-index: 1001;
  }

  .icon15__item--icon {
    width: 100rpx;
    height: 100rpx;
    font-size: 50rpx;
    border-radius: 50%;
    position: relative;
    z-index: 1;
    color: #ffffff;
    background-color: rgba(0, 0, 0, 0.15);
    border: 1rpx solid rgba(255, 255, 255, 0.2);

    &::after {
      content: '';
      position: absolute;
      z-index: -1;
      width: 100%;
      height: 100%;
      left: 0;
      bottom: 0;
      border-radius: inherit;
      background-size: 100% 100%;
    }
  }

  .button-unfavorite {
    border-radius: 100rpx;
  }

  .empty-state {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-left: 30rpx;
    padding-right: 30rpx;
    color: #ffffff;
  }

  .empty-icon {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 72rpx;
  }

  .empty-title {
    margin-top: 28rpx;
    font-size: 34rpx;
    font-weight: 700;
  }

  .empty-desc {
    margin-top: 14rpx;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.76);
  }
</style>
