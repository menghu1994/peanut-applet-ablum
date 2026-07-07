<template>
  <view class="page-c">
    <tn-nav-bar :isBack="false" :bottomShadow="false" backgroundColor="#FFFFFF">
      <view class="custom-nav tn-flex tn-flex-col-center tn-flex-row-left">
        <view class="custom-nav__back">
          <text class="tn-text-bold tn-text-xl tn-color-black">我的收藏</text>
        </view>
      </view>
    </tn-nav-bar>

    <view class="page-c__body" :style="{ paddingTop: vuex_custom_bar_height + 'px' }">
      <view v-if="favoriteList.length" class="favorite-list">
        <view
          v-for="(item, index) in favoriteList"
          :key="item.id || `${item.resourceId || 'favorite'}-${index}`"
          class="favorite-item"
          hover-class="favorite-item--hover"
          @tap="goFavoriteViewer(index)"
        >
          <image class="favorite-cover" :src="getImageUrl(item.resourceCover)" mode="aspectFill" />
          <view class="favorite-info">
            <text class="favorite-name">{{ item.resourceName || item.name || '未命名图片' }}</text>
            <text class="favorite-time">{{ formatTime(item.createdAt || item.updatedAt) }}</text>
          </view>
          <view class="favorite-arrow tn-flex tn-flex-row-center tn-flex-col-center">
            <text class="tn-icon-right"></text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-icon tn-flex tn-flex-row-center tn-flex-col-center">
          <text class="tn-icon-like"></text>
        </view>
        <text class="empty-title">还没有收藏</text>
        <text class="empty-desc">浏览图片时点击爱心即可收藏</text>
      </view>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList } from '@/api/modules/favorite.js'
  import store from '@/nxTemp/store/index.js'
  import { resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    name: 'PagesC',
    data() {
      return {
        favoriteList: []
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      }
    },
    created() {
      this.fetchFavorites()
    },
    activated() {
      this.fetchFavorites()
    },
    methods: {
      getImageUrl(cover) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, cover)
      },

      formatTime(time) {
        if (!time) return '最近收藏'
        const date = new Date(time)
        if (Number.isNaN(date.getTime())) return '最近收藏'
        const month = `${date.getMonth() + 1}`.padStart(2, '0')
        const day = `${date.getDate()}`.padStart(2, '0')
        return `${month}-${day} 收藏`
      },

      async fetchFavorites() {
        try {
          const res = await getFavoriteList({ resourceType: 'album' })
          if (res.code === 0) {
            this.favoriteList = res.data || []
          }
        } catch (e) {
          console.error('获取收藏列表失败:', e)
        }
      },

      goFavoriteViewer(index) {
        uni.navigateTo({
          url: `/pageA/favorite/favorite?index=${index}`
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-c {
    min-height: 100vh;
    background: linear-gradient(180deg, #f6f8fc 0%, #ffffff 100%);
  }

  .custom-nav {
    height: 100%;

    &__back {
      margin: auto 30rpx;
      font-size: 40rpx;
      margin-right: 10rpx;
      flex-basis: 5%;
      width: 160rpx;
      position: absolute;
    }
  }

  .page-c__body {
    padding-bottom: 40rpx;
  }

  .favorite-list {
    padding: 24rpx 30rpx 40rpx;
  }

  .favorite-item {
    display: flex;
    align-items: center;
    min-height: 148rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 24rpx;
    box-shadow: 0 16rpx 40rpx rgba(31, 42, 55, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .favorite-item--hover {
    transform: translateY(-2rpx);
    box-shadow: 0 20rpx 46rpx rgba(31, 42, 55, 0.12);
  }

  .favorite-cover {
    width: 108rpx;
    height: 108rpx;
    flex-shrink: 0;
    border-radius: 18rpx;
    background: #eef2f7;
  }

  .favorite-info {
    flex: 1;
    min-width: 0;
    margin-left: 20rpx;
  }

  .favorite-name {
    display: block;
    font-size: 30rpx;
    line-height: 1.45;
    color: #1f2937;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorite-time {
    display: block;
    margin-top: 10rpx;
    font-size: 24rpx;
    color: #909399;
  }

  .favorite-arrow {
    width: 56rpx;
    height: 56rpx;
    margin-left: 16rpx;
    border-radius: 50%;
    background: #f4f7fb;
    color: #6b7280;
    font-size: 26rpx;
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 220rpx;
    padding-left: 30rpx;
    padding-right: 30rpx;
  }

  .empty-icon {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: #fff1f1;
    color: #ff8b8b;
    font-size: 72rpx;
  }

  .empty-title {
    margin-top: 28rpx;
    font-size: 34rpx;
    color: #303133;
    font-weight: 700;
  }

  .empty-desc {
    margin-top: 14rpx;
    font-size: 26rpx;
    color: #909399;
  }
</style>
