<template>
  <view class="template-photo">
    <!-- 顶部自定义导航 -->
    <tn-nav-bar fixed alpha customBack>
      <view slot="back" class="tn-custom-nav-bar__back" @click="goBack">
        <text class="icon tn-icon-left"></text>
        <text class="icon tn-icon-home-capsule-fill"></text>
      </view>
    </tn-nav-bar>

    <!-- 页面内容 -->
    <view class="slideshow">
      <view class="slideshow-image" :style="'background-image: url(' + imageUrl + ')'"></view>
    </view>

    <!-- 底部操作栏 -->
    <view class="tabbar footerfixed dd-glass tn-color-white" style="border-radius: 100rpx;">
      <view class="action" @click="toggleFavorite">
        <view class="bar-icon">
          <view :class="[isFavorited ? 'tn-icon-heart-fill' : 'tn-icon-like-lack']"></view>
        </view>
        <view class="">{{ isFavorited ? '已收藏' : '收藏' }}</view>
      </view>
      <view class="action" @click="downloadPhoto">
        <view class="bar-icon">
          <view class="tn-icon-download"></view>
        </view>
        <view class="">下载</view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList, addFavorite, removeFavorite } from '@/api/modules/favorite.js'
  import store from '@/nxTemp/store/index.js'
  import { saveImageToAlbumWithPermission } from '@/libs/album/utils.js'

  export default {
    data() {
      return {
        photoId: '',
        imageUrl: '',
        isFavorited: false,
        favoriteId: ''
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      }
    },
    onLoad(options) {
      if (options.id) {
        this.photoId = options.id
      }
      if (options.url) {
        this.imageUrl = decodeURIComponent(options.url)
        if (!this.imageUrl.startsWith('http')) {
          this.imageUrl = `${this.mediaBaseUrl}/${this.imageUrl}`
        }
      }
      this.checkFavorite()
    },
    methods: {
      async checkFavorite() {
        try {
          const res = await getFavoriteList({ resourceType: 'album' })
          if (res.code === 0) {
            const favorites = res.data || []
            const fav = favorites.find(f => f.resourceId === this.photoId)
            if (fav) {
              this.isFavorited = true
              this.favoriteId = fav.id
            }
          }
        } catch (e) {}
      },

      async toggleFavorite() {
        if (this.isFavorited) {
          try {
            const res = await removeFavorite(this.favoriteId)
            if (res.code === 0) {
              this.isFavorited = false
              this.favoriteId = ''
              uni.showToast({ title: '已取消收藏', icon: 'success' })
            }
          } catch (e) {
            uni.showToast({ title: '操作失败', icon: 'none' })
          }
        } else {
          try {
            const res = await addFavorite({
              resourceId: this.photoId,
              resourceType: 'album',
              resourceName: '照片',
              resourceCover: this.imageUrl
            })
            if (res.code === 0) {
              this.isFavorited = true
              uni.showToast({ title: '收藏成功', icon: 'success' })
              this.checkFavorite()
            }
          } catch (e) {
            uni.showToast({ title: '收藏失败', icon: 'none' })
          }
        }
      },

      downloadPhoto() {
        saveImageToAlbumWithPermission(this.imageUrl)
      },

      goBack() {
        uni.navigateBack()
      }
    }
  }
</script>

<style lang="scss" scoped>
  .template-photo {
    min-height: 100vh;
    background: #000;
  }

  .slideshow {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slideshow-image {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .tabbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 120rpx;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
  }

  .action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    color: #FFFFFF;
    font-size: 22rpx;
  }

  .bar-icon {
    font-size: 44rpx;
    margin-bottom: 4rpx;
  }

  .tn-custom-nav-bar__back {
    display: flex;
    align-items: center;
    .icon {
      font-size: 40rpx;
      color: #FFFFFF;
      text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
    }
  }
</style>
