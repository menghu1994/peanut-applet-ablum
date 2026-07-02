<template>
  <view class="page-c">
    <!-- 顶部自定义导航 -->
    <tn-nav-bar :isBack="false" :bottomShadow="false" backgroundColor="none">
      <view class="custom-nav tn-flex tn-flex-col-center tn-flex-row-left">
        <view class="custom-nav__back">
          <text class="tn-text-bold tn-text-xl tn-color-black">我的收藏</text>
        </view>
      </view>
    </tn-nav-bar>

    <view :style="{paddingTop: vuex_custom_bar_height + 'px'}">
      <!-- 收藏列表 -->
      <view class="favorite-list" v-if="favoriteList.length > 0">
        <view
          v-for="(item, index) in favoriteList"
          :key="item.id"
          class="favorite-item"
          @click="goDetail(item)"
        >
          <image class="favorite-cover" :src="getImageUrl(item.resourceCover)" mode="aspectFill" />
          <view class="favorite-info">
            <text class="favorite-name">{{ item.resourceName }}</text>
            <text class="favorite-type">{{ getTypeLabel(item.resourceType) }}</text>
          </view>
          <view class="favorite-action" @click.stop="removeFavorite(item)">
            <text class="tn-icon-like-fill" style="color: #FF6B6B;"></text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <view class="empty-icon">
          <text class="tn-icon-like" style="font-size: 80rpx; color: #ddd;"></text>
        </view>
        <text class="empty-title">还没有收藏</text>
        <text class="empty-desc">浏览相册时点击爱心即可收藏</text>
      </view>
    </view>
  </view>
</template>

<script>
  import { getFavoriteList, removeFavorite as apiRemoveFavorite } from '@/api/modules/favorite.js'
  import store from '@/nxTemp/store/index.js'
  import { buildAlbumDetailUrl, resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    name: 'PageC',
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
    methods: {
      getImageUrl(cover) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, cover)
      },

      getTypeLabel(type) {
        const labels = {
          album: '相册',
          audio: '音频',
          video: '视频',
          picture_book: '绘本',
          recipe: '食谱'
        }
        return labels[type] || type
      },

      async fetchFavorites() {
        try {
          const res = await getFavoriteList()
          if (res.code === 0) {
            this.favoriteList = res.data || []
          }
        } catch (e) {
          console.error('获取收藏列表失败:', e)
        }
      },

      async removeFavorite(item) {
        uni.showModal({
          title: '提示',
          content: '确定取消收藏吗？',
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await apiRemoveFavorite(item.id)
                if (result.code === 0) {
                  uni.showToast({ title: '已取消收藏', icon: 'success' })
                  this.fetchFavorites()
                }
              } catch (e) {
                uni.showToast({ title: '操作失败', icon: 'none' })
              }
            }
          }
        })
      },

      goDetail(item) {
        if (item.resourceType === 'album') {
          uni.navigateTo({
            url: buildAlbumDetailUrl(item, this.mediaBaseUrl)
          })
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-c {
    max-height: 100vh;
  }

  .custom-nav {
    height: 100%;
    &__back {
      margin: auto 30rpx;
    }
  }

  .favorite-list {
    padding: 20rpx 30rpx;
  }

  .favorite-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    margin-bottom: 20rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  }

  .favorite-cover {
    width: 120rpx;
    height: 120rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
    background: #F5F7FA;
  }

  .favorite-info {
    flex: 1;
    margin-left: 20rpx;
    overflow: hidden;
  }

  .favorite-name {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorite-type {
    display: block;
    font-size: 24rpx;
    color: #909399;
    margin-top: 8rpx;
  }

  .favorite-action {
    padding: 16rpx;
    font-size: 40rpx;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 200rpx;
  }

  .empty-icon {
    margin-bottom: 30rpx;
  }

  .empty-title {
    font-size: 32rpx;
    color: #303133;
    font-weight: 600;
  }

  .empty-desc {
    font-size: 26rpx;
    color: #909399;
    margin-top: 12rpx;
  }
</style>
