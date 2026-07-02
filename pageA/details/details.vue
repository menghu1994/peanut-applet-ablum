<template>
  <view class="details-page">
    <tn-nav-bar fixed alpha customBack>
      <view slot="back" class="tn-custom-nav-bar__back" @click="goBack">
        <text class="icon tn-icon-left"></text>
        <text class="icon tn-icon-home-capsule-fill"></text>
      </view>
    </tn-nav-bar>

    <view class="photo-container">
      <view v-if="imageUrl" class="media-stage">
        <image class="photo-image" :src="imageUrl" mode="widthFix" @click="previewImage" @error="onImageError" />
      </view>
    </view>

    <view class="photo-info" v-if="photoName">
      <text class="photo-name">{{ photoName }}</text>
      <view class="photo-meta">
        <text class="meta-item">图片</text>
        <text class="meta-item" v-if="photoCategory">{{ photoCategory }}</text>
        <text class="meta-item" v-if="photoLocation">{{ photoLocation }}</text>
        <text class="meta-item" v-if="photoTakenAt">{{ formatTakenAt(photoTakenAt) }}</text>
        <text class="meta-item" v-if="photoWidth && photoHeight">{{ photoWidth }} x {{ photoHeight }}</text>
        <text class="meta-item" v-if="photoSize">{{ formatSize(photoSize) }}</text>
      </view>

      <view v-if="photoPeople.length" class="tag-group">
        <text v-for="person in photoPeople" :key="person" class="tag-pill">{{ person }}</text>
      </view>

      <view v-if="photoTags.length" class="tag-group">
        <text v-for="tag in photoTags" :key="tag" class="tag-pill tag-pill--soft">{{ tag }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="action-item" @click="toggleFavorite">
        <text :class="[isFavorited ? 'tn-icon-like-fill' : 'tn-icon-like']" :style="{ color: isFavorited ? '#FF6B6B' : '#666' }"></text>
        <text class="action-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="action-item" @click="downloadPhoto">
        <text class="tn-icon-download"></text>
        <text class="action-text">下载</text>
      </view>
      <view class="action-item">
        <button class="share-btn" open-type="share">
          <text class="tn-icon-send"></text>
          <text class="action-text">分享</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList, addFavorite, removeFavorite } from '@/api/modules/favorite.js'
  import { saveImageToAlbumWithPermission } from '@/libs/album/utils.js'

  export default {
    data() {
      return {
        photoId: '',
        photoName: '',
        imageUrl: '',
        photoCategory: '',
        photoLocation: '',
        photoPeople: [],
        photoTags: [],
        photoTakenAt: '',
        photoWidth: 0,
        photoHeight: 0,
        photoSize: 0,
        isFavorited: false,
        favoriteId: ''
      }
    },
    onLoad(options) {
      this.photoId = options.id || ''
      this.photoName = options.name ? decodeURIComponent(options.name) : ''
      this.photoCategory = options.cat ? decodeURIComponent(options.cat) : ''
      this.photoLocation = options.location ? decodeURIComponent(options.location) : ''
      this.photoPeople = options.people ? decodeURIComponent(options.people).split(',').filter(Boolean) : []
      this.photoTags = options.tags ? decodeURIComponent(options.tags).split(',').filter(Boolean) : []
      this.photoTakenAt = options.takenAt ? decodeURIComponent(options.takenAt) : ''
      this.photoWidth = Number(options.w) || 0
      this.photoHeight = Number(options.h) || 0
      this.photoSize = Number(options.size) || 0

      const rawUrl = options.url ? decodeURIComponent(options.url) : ''
      this.imageUrl = rawUrl || ''

      if (this.photoId) {
        this.checkFavorite()
      }
    },
    methods: {
      onImageError(e) {
        console.error('album image load failed:', e, this.imageUrl)
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
            resourceName: this.photoName,
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

      downloadPhoto() {
        saveImageToAlbumWithPermission(this.imageUrl)
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
    },

    onShareAppMessage() {
      return {
        title: this.photoName || '相册图片',
        path: `/pageA/details/details?id=${this.photoId}&url=${encodeURIComponent(this.imageUrl)}&name=${encodeURIComponent(this.photoName)}`
      }
    }
  }
</script>

<style lang="scss" scoped>
  .details-page {
    min-height: 100vh;
    background: #f8f8f8;
    padding-bottom: 140rpx;
  }

  .photo-container {
    width: 100%;
    background: #ffffff;
  }

  .media-stage {
    position: relative;
  }

  .photo-image {
    width: 100%;
    display: block;
  }

  .photo-info {
    margin: 24rpx;
    padding: 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
  }

  .photo-name {
    display: block;
    font-size: 34rpx;
    color: #222222;
    font-weight: 600;
  }

  .photo-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-top: 18rpx;
  }

  .meta-item {
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: #f3f5fb;
    font-size: 22rpx;
    color: #5b6475;
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-top: 20rpx;
  }

  .tag-pill {
    padding: 10rpx 18rpx;
    border-radius: 999rpx;
    background: #eef3ff;
    color: #3668fc;
    font-size: 22rpx;
  }

  .tag-pill--soft {
    background: #fff3e8;
    color: #f08a24;
  }

  .bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 -8rpx 30rpx rgba(32, 55, 120, 0.08);
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10rpx;
    font-size: 22rpx;
    color: #666666;
  }

  .action-text {
    font-size: 22rpx;
    color: inherit;
  }

  .share-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10rpx;
    background: transparent;
    padding: 0;
    line-height: 1;
    color: #666666;
  }

  .share-btn::after {
    border: 0;
  }
</style>
