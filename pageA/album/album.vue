<template>
  <view class="album-page">
    <tn-nav-bar :isBack="true" :bottomShadow="false" backgroundColor="#FFFFFF">
      <view class="custom-nav">
        <text class="tn-text-bold tn-text-xl tn-color-black">{{ categoryName || '相册' }}</text>
      </view>
    </tn-nav-bar>

    <view :style="{paddingTop: vuex_custom_bar_height + 'px'}">
      <!-- 照片网格 -->
      <view class="photo-grid" v-if="photoList.length > 0">
        <view
          v-for="(item, index) in photoList"
          :key="item.id"
          class="photo-item"
          @click="goDetail(item)"
        >
          <image :src="getImageUrl(item)" mode="aspectFill" class="photo-image" />
        </view>
      </view>

      <view class="empty-state" v-else-if="loadStatus !== 'loading'">
        <text class="tn-icon-image" style="font-size: 80rpx; color: #ddd;"></text>
        <text class="empty-text">暂无照片</text>
      </view>

      <tn-load-more :status="loadStatus"></tn-load-more>
    </view>
  </view>
</template>

<script>
  import { getAlbumList } from '@/api/modules/album.js'
  import store from '@/nxTemp/store/index.js'
  import { buildAlbumDetailUrl, resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    data() {
      return {
        categoryName: '',
        category: '',
        photoList: [],
        page: 1,
        pageSize: 30,
        total: 0,
        loadStatus: 'loadmore'
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      }
    },
    onLoad(options) {
      if (options.category) {
        this.category = options.category
        this.categoryName = options.categoryName || options.category
      }
      this.fetchPhotos()
    },
    onReachBottom() {
      if (this.loadStatus === 'nomore') return
      this.page++
      this.fetchPhotos()
    },
    methods: {
      getImageUrl(item) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, item.thumbnailUrl || item.displayUrl || item.url)
      },

      async fetchPhotos() {
        if (this.loadStatus === 'loading') return
        this.loadStatus = 'loading'

        try {
          const params = {
            page: this.page,
            pageSize: this.pageSize
          }
          if (this.category) {
            params.category = this.category
          }

          const res = await getAlbumList(params)
          if (res.code === 0) {
            const newData = res.data || []
            this.photoList = this.page === 1 ? newData : [...this.photoList, ...newData]
            this.total = (res.pagination && res.pagination.total) || this.photoList.length
            this.loadStatus = this.photoList.length >= this.total ? 'nomore' : 'loadmore'
          }
        } catch (e) {
          console.error('获取照片失败:', e)
          this.loadStatus = 'loadmore'
        }
      },

      goDetail(item) {
        uni.navigateTo({
          url: buildAlbumDetailUrl(item, this.mediaBaseUrl)
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .album-page {
    min-height: 100vh;
    background: #F8F8F8;
  }

  .custom-nav {
    text-align: center;
  }

  .photo-grid {
    display: flex;
    flex-wrap: wrap;
    padding: 10rpx;
  }

  .photo-item {
    width: 33.33%;
    padding: 5rpx;
  }

  .photo-image {
    width: 100%;
    height: 240rpx;
    border-radius: 8rpx;
    background: #F0F0F0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 200rpx;
  }

  .empty-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
</style>
