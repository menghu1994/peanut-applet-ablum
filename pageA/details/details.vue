<template>
  <view class="template-details">
    <tn-nav-bar fixed alpha customBack>
      <view slot="back" class="tn-custom-nav-bar__back" @click="goBack">
        <text class="icon tn-icon-left"></text>
        <text class="icon tn-icon-home-capsule-fill"></text>
      </view>
    </tn-nav-bar>

    <view class="slideshow" @click="previewImage">
      <view v-if="!imageLoaded && !thumbUrl" class="slideshow-placeholder"></view>
      <image
        v-if="thumbUrl"
        class="slideshow-thumb"
        :src="thumbUrl"
        mode="aspectFit"
      ></image>
      <image
        v-if="imageUrl"
        class="slideshow-image"
        :class="{ 'slideshow-image--loaded': imageLoaded }"
        :src="imageUrl"
        mode="aspectFit"
        @load="handleImageLoad"
        @error="handleImageError"
      ></image>
    </view>

    <view class="detail-panel" :style="{ bottom: panelBottom }">
      <view class="detail-panel__content">
        <text class="detail-title">{{ photoName || '照片详情' }}</text>
        <view class="detail-tags">
          <text class="detail-tag">图片</text>
          <text v-if="photoCategory" class="detail-tag">{{ photoCategory }}</text>
          <text v-if="photoLocation" class="detail-tag">{{ photoLocation }}</text>
          <text v-if="photoTakenAt" class="detail-tag">{{ formatTakenAt(photoTakenAt) }}</text>
          <text v-if="photoWidth && photoHeight" class="detail-tag">{{ photoWidth }} x {{ photoHeight }}</text>
          <text v-if="photoSize" class="detail-tag">{{ formatSize(photoSize) }}</text>
        </view>
        <view v-if="photoPeople.length" class="detail-tags detail-tags--soft">
          <text v-for="person in photoPeople" :key="person" class="detail-tag detail-tag--soft">{{ person }}</text>
        </view>
        <view v-if="photoTags.length" class="detail-tags detail-tags--soft">
          <text v-for="tag in photoTags" :key="tag" class="detail-tag detail-tag--warm">{{ tag }}</text>
        </view>
      </view>
    </view>

    <view class="tabbar footerfixed dd-glass tn-color-white">
      <view class="action" @click="toggleFavorite">
        <view class="bar-icon">
          <view :class="[isFavorited ? 'tn-icon-like-fill' : 'tn-icon-like-lack']"></view>
        </view>
        <view>{{ isFavorited ? '已收藏' : '收藏' }}</view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList, addFavorite, removeFavorite } from '@/api/modules/favorite.js'

  export default {
    data() {
      return {
        photoId: '',
        photoName: '',
        imageUrl: '',
        thumbUrl: '',
        photoCategory: '',
        photoLocation: '',
        photoPeople: [],
        photoTags: [],
        photoTakenAt: '',
        photoWidth: 0,
        photoHeight: 0,
        photoSize: 0,
        imageLoaded: false,
        isFavorited: false,
        favoriteId: ''
      }
    },
    computed: {
      panelBottom() {
        return 'calc(170rpx + env(safe-area-inset-bottom))'
      }
    },
    onLoad(options) {
      this.photoId = options.id || ''
      this.photoName = options.name ? decodeURIComponent(options.name) : ''
      this.thumbUrl = options.thumb ? decodeURIComponent(options.thumb) : ''
      this.photoCategory = options.cat ? decodeURIComponent(options.cat) : ''
      this.photoLocation = options.location ? decodeURIComponent(options.location) : ''
      this.photoPeople = options.people ? decodeURIComponent(options.people).split(',').filter(Boolean) : []
      this.photoTags = options.tags ? decodeURIComponent(options.tags).split(',').filter(Boolean) : []
      this.photoTakenAt = options.takenAt ? decodeURIComponent(options.takenAt) : ''
      this.photoWidth = Number(options.w) || 0
      this.photoHeight = Number(options.h) || 0
      this.photoSize = Number(options.size) || 0
      this.imageUrl = options.url ? decodeURIComponent(options.url) : ''

      this.preloadImage()

      if (this.photoId) {
        this.checkFavorite()
      }
    },
    methods: {
      preloadImage() {
        if (!this.imageUrl) return

        uni.getImageInfo({
          src: this.imageUrl,
          success: (res) => {
            if (!this.photoWidth) {
              this.photoWidth = Number(res.width) || 0
            }
            if (!this.photoHeight) {
              this.photoHeight = Number(res.height) || 0
            }
          },
          fail: () => {}
        })
      },

      handleImageLoad() {
        this.imageLoaded = true
      },

      handleImageError() {
        this.imageLoaded = true
      },

      async checkFavorite() {
        try {
          const res = await getFavoriteList({ resourceType: 'album' })
          if (res.code === 0) {
            const favorites = res.data || []
            const fav = favorites.find((item) => item.resourceId === this.photoId)
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
          return
        }

        try {
          const res = await addFavorite({
            resourceId: this.photoId,
            resourceType: 'album',
            resourceName: this.photoName || '照片',
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
      },

      previewImage() {
        if (!this.imageUrl) return
        uni.previewImage({
          urls: [this.imageUrl],
          current: this.imageUrl
        })
      },

      formatSize(bytes) {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      },

      formatTakenAt(value) {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      },

      goBack() {
        uni.navigateBack()
      }
    }
  }
</script>

<style lang="scss" scoped>
  .template-details {
    margin: 0;
    width: 100%;
    height: 100vh;
    color: #fff;
    overflow: hidden;
    background: #000;
    position: relative;
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
      content: ' ';
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

  .slideshow {
    width: 100%;
    height: 100vh;
    position: relative;
    background: #05070c;
    overflow: hidden;
  }

  .slideshow-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(56, 63, 79, 0.9) 18%, rgba(79, 86, 103, 0.9) 38%, rgba(56, 63, 79, 0.9) 58%);
    background-size: 200% 100%;
    animation: photo-shimmer 1.4s ease-in-out infinite;
  }

  .slideshow-thumb,
  .slideshow-image {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
  }

  .slideshow-thumb {
    transform: scale(1.06);
    filter: blur(18rpx);
    opacity: 0.42;
  }

  .slideshow-image {
    opacity: 0;
    transition: opacity 0.24s ease;
  }

  .slideshow-image--loaded {
    opacity: 1;
  }

  .detail-panel {
    position: fixed;
    left: 24rpx;
    right: 24rpx;
    z-index: 20;
  }

  .detail-panel__content {
    padding: 24rpx 24rpx 22rpx;
    border-radius: 24rpx;
    background: rgba(7, 10, 17, 0.44);
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);
    box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.18);
  }

  .detail-title {
    display: block;
    font-size: 34rpx;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.4;
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 18rpx;
  }

  .detail-tags--soft {
    margin-top: 14rpx;
  }

  .detail-tag {
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.14);
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.92);
  }

  .detail-tag--soft {
    background: rgba(76, 111, 255, 0.22);
  }

  .detail-tag--warm {
    background: rgba(255, 181, 71, 0.22);
  }

  .dd-glass {
    width: 100%;
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);
  }

  .footerfixed {
    position: fixed;
    margin: 40rpx 5%;
    width: 90%;
    bottom: calc(env(safe-area-inset-bottom) / 2);
    z-index: 999;
    background-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0rpx 0rpx 30rpx 0rpx rgba(0, 0, 0, 0.07);
  }

  .tabbar {
    display: flex;
    align-items: center;
    min-height: 110rpx;
    justify-content: space-between;
    padding: 0;
    height: calc(110rpx + env(safe-area-inset-bottom) / 2);
  }

  .tabbar .action {
    font-size: 22rpx;
    position: relative;
    flex: 1;
    text-align: center;
    padding: 0;
    display: block;
    height: auto;
    line-height: 1;
    margin: 0;
    overflow: initial;
  }

  .tabbar .action .bar-icon {
    width: 100rpx;
    position: relative;
    display: block;
    height: auto;
    margin: 0 auto 10rpx;
    text-align: center;
    font-size: 42rpx;
  }

  @keyframes photo-shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
</style>
