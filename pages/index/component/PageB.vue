<template>
  <view class="page-b">
    <tn-nav-bar :isBack="false" :bottomShadow="false" backgroundColor="none">
      <view class="custom-nav tn-flex tn-flex-col-center tn-flex-row-left">
        <view class="custom-nav__back">
          <text class="tn-text-bold tn-text-xl tn-color-black">图片分类</text>
        </view>
      </view>
    </tn-nav-bar>

    <view class="classify-wrap" :style="{ paddingTop: vuex_custom_bar_height + 'px' }">
      <view class="classify-container">
        <scroll-view class="left-box" scroll-y :style="{ height: scrollHeight + 'px' }">
          <block v-if="initialLoading">
            <view v-for="item in 6" :key="`left-skeleton-${item}`" class="left-item">
              <view class="skeleton-block left-item-skeleton"></view>
            </view>
          </block>
          <block v-else>
            <view
              v-for="(item, index) in categoryList"
              :key="index"
              class="left-item"
              :class="{ active: currentTabbarIndex === index }"
              @tap.stop="clickClassifyNav(index)"
            >
              <text>{{ item.label || item.value || '全部' }}</text>
            </view>
          </block>
          <view v-if="!initialLoading && categoryList.length === 0" class="left-item active">
            <text>全部</text>
          </view>
        </scroll-view>

        <scroll-view class="right-box" scroll-y :style="{ height: scrollHeight + 'px' }" @scrolltolower="loadMore">
          <view v-if="initialLoading" class="right-content right-content--skeleton">
            <view v-for="item in 6" :key="`photo-skeleton-${item}`" class="photo-card photo-card--skeleton">
              <view class="photo-image-wrap">
                <view class="photo-image skeleton-block"></view>
              </view>
              <view class="skeleton-block photo-name-skeleton"></view>
            </view>
          </view>
          <view class="right-content" v-else-if="categoryPhotos.length > 0">
            <navigator
              v-for="(item, index) in categoryPhotos"
              :key="item.id || index"
              class="photo-card"
              :url="buildDetailUrl(item)"
              hover-class="none"
            >
              <view class="photo-image-wrap">
                <image :src="getImageUrl(item)" mode="aspectFill" class="photo-image" />
              </view>
              <text class="photo-name">{{ item.name }}</text>
            </navigator>
          </view>
          <view class="empty-tip" v-else-if="loadStatus !== 'loading'">
            <text class="tn-icon-image" style="font-size: 60rpx; color: #ddd;"></text>
            <text style="color: #999; margin-top: 10rpx;">暂无照片</text>
          </view>
          <tn-load-more v-if="!initialLoading" :status="loadStatus"></tn-load-more>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getAlbumList, getAlbumCategories } from '@/api/modules/album.js'
  import store from '@/nxTemp/store/index.js'
  import { buildAlbumDetailUrl, resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    name: 'PageB',
    data() {
      return {
        categoryList: [],
        currentTabbarIndex: 0,
        categoryPhotos: [],
        page: 1,
        pageSize: 20,
        total: 0,
        loadStatus: 'loadmore',
        scrollHeight: 500,
        initialLoading: true
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      }
    },
    mounted() {
      this.calcScrollHeight()
      this.fetchCategories()
    },
    methods: {
      calcScrollHeight() {
        try {
          const sysInfo = uni.getSystemInfoSync()
          this.scrollHeight = sysInfo.windowHeight - (this.vuex_custom_bar_height || 44) - 50
        } catch (e) {
          this.scrollHeight = 500
        }
      },

      getImageUrl(item) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, item.thumbnailUrl || item.displayUrl || '')
      },

      buildDetailUrl(item) {
        return buildAlbumDetailUrl(item, this.mediaBaseUrl)
      },

      async fetchCategories() {
        try {
          const res = await getAlbumCategories()
          if (res.code === 0 && Array.isArray(res.data)) {
            this.categoryList = res.data
          }
        } catch (e) {
          console.error('获取分类失败:', e)
        }
        this.fetchCategoryPhotos(true)
      },

      async fetchCategoryPhotos(reset) {
        if (this.loadStatus === 'loading') return

        if (reset) {
          this.page = 1
          this.categoryPhotos = []
        }

        this.loadStatus = 'loading'

        try {
          const params = {
            page: this.page,
            pageSize: this.pageSize
          }

          const cat = this.categoryList[this.currentTabbarIndex]
          if (cat && cat.value && cat.value !== 'all') {
            params.category = cat.value
          }

          const res = await getAlbumList(params)
          if (res.code === 0) {
            const newData = res.data || []
            this.categoryPhotos = reset ? newData : [...this.categoryPhotos, ...newData]
            this.total = (res.pagination && res.pagination.total) || this.categoryPhotos.length
            this.loadStatus = this.categoryPhotos.length >= this.total ? 'nomore' : 'loadmore'
          } else {
            this.loadStatus = 'loadmore'
          }
        } catch (e) {
          console.error('获取分类照片失败:', e)
          this.loadStatus = 'loadmore'
        } finally {
          this.initialLoading = false
        }
      },

      clickClassifyNav(index) {
        if (this.currentTabbarIndex === index) return
        this.currentTabbarIndex = index
        this.fetchCategoryPhotos(true)
      },

      loadMore() {
        if (this.loadStatus === 'nomore') return
        this.page += 1
        this.fetchCategoryPhotos(false)
      },
    }
  }
</script>

<style lang="scss" scoped>
  .page-b {
    max-height: 100vh;
    overflow: hidden;
  }

  .custom-nav {
    height: 100%;

    &__back {
      margin: auto 30rpx;
    }
  }

  .classify-wrap {
    height: calc(100vh - 50px);
  }

  .classify-container {
    display: flex;
    height: 100%;
  }

  .left-box {
    width: 200rpx;
    background: #f5f5f5;
  }

  .left-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    font-size: 26rpx;
    color: #606266;
    position: relative;

    &.active {
      background: #ffffff;
      color: #3668fc;
      font-weight: bold;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6rpx;
        height: 40rpx;
        background: #3668fc;
        border-radius: 0 6rpx 6rpx 0;
      }
    }
  }

  .left-item-skeleton {
    width: 112rpx;
    height: 28rpx;
    border-radius: 999rpx;
  }

  .right-box {
    flex: 1;
    background: #ffffff;
  }

  .right-content {
    display: flex;
    flex-wrap: wrap;
    padding: 10rpx;
  }

  .right-content--skeleton {
    pointer-events: none;
  }

  .photo-card {
    width: 50%;
    padding: 10rpx;
    box-sizing: border-box;
  }

  .photo-card--skeleton {
    display: block;
  }

  .photo-image-wrap {
    position: relative;
  }

  .photo-image {
    width: 100%;
    height: 240rpx;
    border-radius: 12rpx;
    background: #f0f0f0;
  }

  .photo-name {
    display: block;
    font-size: 24rpx;
    color: #303133;
    margin-top: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .photo-name-skeleton {
    width: 72%;
    height: 24rpx;
    margin-top: 12rpx;
    border-radius: 999rpx;
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 100rpx;
  }

  .skeleton-block {
    background: linear-gradient(120deg, #eef3f7 18%, #f8fbfd 38%, #eef3f7 58%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
</style>
