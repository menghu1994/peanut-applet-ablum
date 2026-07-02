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
          <view
            v-for="(item, index) in categoryList"
            :key="index"
            class="left-item"
            :class="{ active: currentTabbarIndex === index }"
            @tap.stop="clickClassifyNav(index)"
          >
            <text>{{ item.label || item.value || '全部' }}</text>
          </view>
          <view v-if="categoryList.length === 0" class="left-item active">
            <text>全部</text>
          </view>
        </scroll-view>

        <scroll-view class="right-box" scroll-y :style="{ height: scrollHeight + 'px' }" @scrolltolower="loadMore">
          <view class="right-content" v-if="categoryPhotos.length > 0">
            <view v-for="(item, index) in categoryPhotos" :key="item.id || index" class="photo-card" @tap="goDetail(item)">
              <view class="photo-image-wrap">
                <view v-if="getMediaBadge(item)" class="photo-badge">{{ getMediaBadge(item) }}</view>
                <image :src="getImageUrl(item)" mode="aspectFill" class="photo-image" />
              </view>
              <text class="photo-name">{{ item.name }}</text>
            </view>
          </view>
          <view class="empty-tip" v-else-if="loadStatus !== 'loading'">
            <text class="tn-icon-image" style="font-size: 60rpx; color: #ddd;"></text>
            <text style="color: #999; margin-top: 10rpx;">暂无照片</text>
          </view>
          <tn-load-more :status="loadStatus"></tn-load-more>
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
        scrollHeight: 500
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

      getMediaBadge(item) {
        if (!item) return ''
        if (item.mediaType === 'live_photo' || item.isLivePhoto) {
          return 'LIVE'
        }
        if (item.mediaType === 'video') {
          return 'VIDEO'
        }
        return ''
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

      goDetail(item) {
        const url = buildAlbumDetailUrl(item, this.mediaBaseUrl)
        if (!url) {
          uni.showToast({ title: '详情信息不完整', icon: 'none' })
          return
        }
        uni.navigateTo({ url })
      }
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

  .right-box {
    flex: 1;
    background: #ffffff;
  }

  .right-content {
    display: flex;
    flex-wrap: wrap;
    padding: 10rpx;
  }

  .photo-card {
    width: 50%;
    padding: 10rpx;
    box-sizing: border-box;
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

  .photo-badge {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    z-index: 2;
    padding: 6rpx 12rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    line-height: 1;
    color: #ffffff;
    background: rgba(31, 42, 55, 0.72);
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

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 100rpx;
  }
</style>
