<template>
  <view class="details-page">
    <tn-nav-bar fixed alpha customBack>
      <view slot="back" class="tn-custom-nav-bar__back" @click="goBack">
        <text class="icon tn-icon-left"></text>
        <text class="icon tn-icon-home-capsule-fill"></text>
      </view>
    </tn-nav-bar>

    <view class="photo-container">
      <view v-if="isVideo" class="media-stage">
        <!-- #ifdef H5 -->
        <video v-if="videoUrl" class="video-player" :src="videoUrl" :poster="imageUrl" controls></video>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <image v-if="imageUrl" class="photo-image" :src="imageUrl" mode="widthFix" />
        <view v-else class="media-placeholder">
          <text class="media-placeholder__icon tn-icon-play-fill"></text>
        </view>
        <view class="media-notice">
          <text class="media-notice__title">已识别为视频文件</text>
          <text class="media-notice__desc">当前微信小程序未接入视频播放资质，先按就绪入库和展示处理</text>
        </view>
        <!-- #endif -->
      </view>

      <view v-else-if="imageUrl" class="media-stage">
        <image class="photo-image" :src="imageUrl" mode="widthFix" @click="previewImage" @error="onImageError" />
        <view v-if="isLivePhoto" class="live-pill">LIVE</view>
      </view>
    </view>

    <view class="photo-info" v-if="photoName">
      <text class="photo-name">{{ photoName }}</text>
      <view class="photo-meta">
        <text class="meta-item">{{ mediaTypeLabel }}</text>
        <text class="meta-item" v-if="photoCategory">{{ photoCategory }}</text>
        <text class="meta-item" v-if="photoLocation">{{ photoLocation }}</text>
        <text class="meta-item" v-if="photoTakenAt">{{ formatTakenAt(photoTakenAt) }}</text>
        <text class="meta-item" v-if="photoDuration">{{ formatDuration(photoDuration) }}</text>
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
        <text class="action-text">{{ isVideo ? '不支持' : '下载' }}</text>
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
  import store from '@/nxTemp/store/index.js'
  import { saveImageToAlbumWithPermission } from '@/libs/album/utils.js'

  export default {
    data() {
      return {
        photoId: '',
        photoName: '',
        imageUrl: '',
        videoUrl: '',
        mediaType: 'image',
        photoCategory: '',
        photoLocation: '',
        photoPeople: [],
        photoTags: [],
        photoTakenAt: '',
        photoWidth: 0,
        photoHeight: 0,
        photoSize: 0,
        photoDuration: 0,
        isFavorited: false,
        favoriteId: ''
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      },
      isVideo() {
        return this.mediaType === 'video'
      },
      isLivePhoto() {
        return this.mediaType === 'live_photo'
      },
      mediaTypeLabel() {
        if (this.isLivePhoto) return '实况'
        if (this.isVideo) return '视频'
        return '图片'
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
      this.photoDuration = Number(options.duration) || 0
      this.mediaType = options.mediaType ? decodeURIComponent(options.mediaType) : 'image'

      const rawUrl = options.url ? decodeURIComponent(options.url) : ''
      if (rawUrl) {
        this.imageUrl = rawUrl.startsWith('http') ? rawUrl : `${this.mediaBaseUrl}/${rawUrl}`
      }

      const rawVideoUrl = options.video ? decodeURIComponent(options.video) : ''
      if (rawVideoUrl) {
        this.videoUrl = rawVideoUrl.startsWith('http') ? rawVideoUrl : `${this.mediaBaseUrl}/${rawVideoUrl}`
      }

      if (this.photoId) {
        this.checkFavorite()
      }
    },
    methods: {
      onImageError(e) {
        console.error('album media load failed:', e, this.imageUrl)
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
        } else {
          try {
            const res = await addFavorite({
              resourceId: this.photoId,
              resourceType: 'album',
              resourceName: this.photoName,
              resourceCover: this.imageUrl || this.videoUrl
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
        if (this.isVideo) {
          uni.showToast({ title: '视频文件暂未接入小程序下载', icon: 'none' })
          return
        }
        saveImageToAlbumWithPermission(this.imageUrl)
      },

      previewImage() {
        if (!this.imageUrl || this.isVideo) return
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

      formatDuration(seconds) {
        if (!seconds) return ''
        const totalSeconds = Math.max(Number(seconds) || 0, 0)
        const minutes = Math.floor(totalSeconds / 60)
        const restSeconds = totalSeconds % 60
        return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
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
        title: this.photoName || '相册媒体',
        path: `/pageA/details/details?id=${this.photoId}&url=${encodeURIComponent(this.imageUrl)}&video=${encodeURIComponent(this.videoUrl)}&mediaType=${encodeURIComponent(this.mediaType)}&name=${encodeURIComponent(this.photoName)}`
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
    min-height: 400rpx;
    background: #f0f0f0;
  }

  .video-player {
    width: 100%;
    min-height: 420rpx;
    background: #000000;
  }

  .media-placeholder {
    width: 100%;
    min-height: 420rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #dfe7f4, #edf2f8);
  }

  .media-placeholder__icon {
    font-size: 88rpx;
    color: #556070;
  }

  .media-notice {
    padding: 24rpx 30rpx;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    background: #ffffff;
  }

  .media-notice__title {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
  }

  .media-notice__desc {
    font-size: 24rpx;
    color: #7d8998;
    line-height: 1.6;
  }

  .live-pill {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    padding: 10rpx 16rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    color: #ffffff;
    background: rgba(31, 42, 55, 0.72);
  }

  .photo-info {
    margin: 20rpx 30rpx;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .photo-name {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16rpx;
  }

  .photo-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .meta-item {
    padding: 6rpx 16rpx;
    background: #f5f7fa;
    border-radius: 8rpx;
    font-size: 24rpx;
    color: #606266;
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 18rpx;
  }

  .tag-pill {
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    color: #3658c9;
    background: #edf2ff;

    &--soft {
      color: #5f6b7a;
      background: #f2f5f8;
    }
  }

  .bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 120rpx;
    padding-bottom: env(safe-area-inset-bottom);
    background: #ffffff;
    box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
    z-index: 100;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;

    text {
      font-size: 44rpx;
    }
  }

  .action-text {
    font-size: 22rpx !important;
    color: #606266;
    margin-top: 4rpx;
  }

  .share-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    line-height: 1;

    &::after {
      border: none;
    }
  }

  .tn-custom-nav-bar__back {
    display: flex;
    align-items: center;

    .icon {
      font-size: 40rpx;
      color: #ffffff;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
    }
  }
</style>
