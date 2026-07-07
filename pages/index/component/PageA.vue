<template>
  <view class="page-a">
    <view v-if="initialLoading" class="hero hero--skeleton" :style="{ paddingTop: `${(vuex_status_bar_height || 0) + 24}px` }">
      <view class="hero__copy">
        <view class="skeleton-block hero__title-skeleton"></view>
        <view class="skeleton-block hero__meta-skeleton"></view>
      </view>
    </view>

    <view v-else class="hero" :style="{ paddingTop: `${(vuex_status_bar_height || 0) + 24}px` }">
      <view class="hero__copy">
        <text class="hero__title">照片拾光</text>
        <text class="hero__meta">{{ totalLabel }}</text>
      </view>
    </view>

    <view v-if="initialLoading" class="search-panel search-panel--skeleton">
      <view class="skeleton-block search-bar-skeleton"></view>
    </view>

    <view v-else class="search-panel">
      <view class="search-bar">
        <text class="tn-icon-search search-bar__icon"></text>
        <input
          v-model.trim="keyword"
          class="search-bar__input"
          placeholder="搜索照片、地点或标签"
          confirm-type="search"
          @confirm="searchAlbums"
        />
        <text v-if="keyword" class="tn-icon-close-circle search-bar__clear" @tap.stop="clearKeyword"></text>
      </view>
    </view>

    <view class="album-container">
      <view v-if="initialLoading" class="waterfall waterfall--skeleton">
        <view class="waterfall__column">
          <view v-for="item in skeletonLeft" :key="`left-${item}`" class="wallpaper__item wallpaper__item--skeleton">
            <view class="item__image skeleton-block" :style="{ height: `${280 + item * 36}rpx` }"></view>
            <view class="item__data">
              <view class="skeleton-block item__title-skeleton"></view>
              <view class="item__meta">
                <view class="skeleton-block item__meta-skeleton"></view>
                <view class="skeleton-block item__meta-skeleton item__meta-skeleton--short"></view>
              </view>
            </view>
          </view>
        </view>

        <view class="waterfall__column">
          <view v-for="item in skeletonRight" :key="`right-${item}`" class="wallpaper__item wallpaper__item--skeleton">
            <view class="item__image skeleton-block" :style="{ height: `${330 + item * 28}rpx` }"></view>
            <view class="item__data">
              <view class="skeleton-block item__title-skeleton"></view>
              <view class="item__meta">
                <view class="skeleton-block item__meta-skeleton"></view>
                <view class="skeleton-block item__meta-skeleton item__meta-skeleton--short"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="waterfall.left.length || waterfall.right.length" class="waterfall">
        <view class="waterfall__column">
          <view v-for="item in waterfall.left" :key="item.id" class="wallpaper__item" @tap="goDetail(item)">
            <view class="item__image">
              <tn-lazy-load
                :threshold="1600"
                height="100%"
                :image="getImageUrl(item)"
                :index="item.id"
                imgMode="widthFix"
              ></tn-lazy-load>
            </view>
            <view class="item__data">
              <text class="item__title tn-color-black">{{ item.name }}</text>
              <view class="item__meta">
                <text class="item__meta-text">{{ item.categoryName || item.category || '未分类' }}</text>
                <text v-if="item.location" class="item__meta-text">{{ item.location }}</text>
              </view>
              <view v-if="item.tags && item.tags.length" class="item__tags">
                <text v-for="tag in item.tags.slice(0, 2)" :key="tag" class="item__tag">{{ tag }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="waterfall__column">
          <view v-for="item in waterfall.right" :key="item.id" class="wallpaper__item" @tap="goDetail(item)">
            <view class="item__image">
              <tn-lazy-load
                :threshold="1600"
                height="100%"
                :image="getImageUrl(item)"
                :index="item.id"
                imgMode="widthFix"
              ></tn-lazy-load>
            </view>
            <view class="item__data">
              <text class="item__title tn-color-black">{{ item.name }}</text>
              <view class="item__meta">
                <text class="item__meta-text">{{ item.categoryName || item.category || '未分类' }}</text>
                <text v-if="item.location" class="item__meta-text">{{ item.location }}</text>
              </view>
              <view v-if="item.tags && item.tags.length" class="item__tags">
                <text v-for="tag in item.tags.slice(0, 2)" :key="tag" class="item__tag">{{ tag }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!albumList.length && loadStatus !== 'loading'" class="empty-state">
        <text class="tn-icon-image empty-state__icon"></text>
        <text class="empty-state__title">没有找到符合条件的照片</text>
      </view>

      <tn-load-more v-if="!initialLoading" :status="loadStatus"></tn-load-more>
    </view>
  </view>
</template>

<script>
  import { getAlbumList } from '@/api/modules/album.js'
  import store from '@/nxTemp/store/index.js'
  import { buildAlbumDetailUrl, resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  export default {
    name: 'PagesA',
    data() {
      return {
        keyword: '',
        albumList: [],
        waterfall: {
          left: [],
          right: []
        },
        waterfallHeight: {
          left: 0,
          right: 0
        },
        skeletonLeft: [1, 2, 3],
        skeletonRight: [1, 2, 3],
        page: 1,
        pageSize: 20,
        total: 0,
        loadStatus: 'loadmore',
        initialLoading: true
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      },
      totalLabel() {
        return this.total ? `${this.total} 张照片` : '整理中的回忆'
      }
    },
    created() {
      this.fetchAlbumList(true)
    },
    methods: {
      getImageUrl(item) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, item.thumbnailUrl || item.displayUrl || '')
      },

      buildQueryParams() {
        const params = {
          page: this.page,
          pageSize: this.pageSize
        }

        if (this.keyword) {
          params.keyword = this.keyword
        }

        return params
      },

      async fetchAlbumList(reset = false) {
        if (this.loadStatus === 'loading') return

        if (reset) {
          this.page = 1
          this.total = 0
          this.albumList = []
          this.resetWaterfall()
        }

        this.loadStatus = 'loading'

        try {
          const res = await getAlbumList(this.buildQueryParams())
          if (res.code !== 0) {
            this.loadStatus = reset ? 'loadmore' : this.loadStatus
            return
          }

          const newData = (res.data || []).map((item, index) => ({
            ...item,
            id: item.id || item.resourceId || `album_${this.page}_${index}_${Date.now()}`
          }))

          this.albumList = reset ? newData : [...this.albumList, ...newData]
          this.total = (res.pagination && res.pagination.total) || this.albumList.length
          this.appendWaterfallItems(newData, reset)
          this.loadStatus = this.albumList.length >= this.total ? 'nomore' : 'loadmore'
        } catch (e) {
          console.error('获取相册列表失败:', e)
          if (!reset && this.page > 1) {
            this.page -= 1
          }
          this.loadStatus = 'loadmore'
        } finally {
          this.initialLoading = false
        }
      },

      resetWaterfall() {
        this.waterfall = {
          left: [],
          right: []
        }
        this.waterfallHeight = {
          left: 0,
          right: 0
        }
      },

      appendWaterfallItems(items, reset = false) {
        if (reset) {
          this.resetWaterfall()
        }

        ;(Array.isArray(items) ? items : []).forEach((item) => {
          const side = this.waterfallHeight.left <= this.waterfallHeight.right ? 'left' : 'right'
          this.waterfall[side].push(item)
          this.waterfallHeight[side] += this.estimateCardHeight(item)
        })
      },

      estimateCardHeight(item) {
        const width = Number(item.width) || 1
        const height = Number(item.height) || width
        const ratioHeight = height / width
        const imageHeight = 320 * ratioHeight
        const metaLines = 110 + ((item.location || item.categoryName || item.category) ? 28 : 0) + ((item.tags && item.tags.length) ? 32 : 0)
        return imageHeight + metaLines
      },

      searchAlbums() {
        this.fetchAlbumList(true)
      },

      clearKeyword() {
        if (!this.keyword) return
        this.keyword = ''
        this.fetchAlbumList(true)
      },

      goDetail(item) {
        const url = buildAlbumDetailUrl(item, this.mediaBaseUrl)
        if (!url) {
          uni.showToast({ title: '详情信息不完整', icon: 'none' })
          return
        }
        uni.navigateTo({ url })
      },

      getRandomData() {
        if (this.loadStatus === 'loading' || this.loadStatus === 'nomore') return
        this.page += 1
        this.fetchAlbumList(false)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-a {
    min-height: 100vh;
    background: linear-gradient(180deg, #f6f9ff 0%, #f9fafc 220rpx, #f7f7f7 100%);
  }

  .hero {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0 30rpx 20rpx;

    &__copy {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    &__title {
      font-size: 44rpx;
      font-weight: bold;
      color: #1f2a37;
    }

    &__meta {
      font-size: 24rpx;
      color: #7d8998;
    }
  }

  .hero--skeleton {
    align-items: center;
  }

  .search-panel {
    margin: 0 24rpx 20rpx;
    padding: 24rpx;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 24rpx;
    box-shadow: 0 12rpx 36rpx rgba(31, 42, 55, 0.06);
  }

  .search-panel--skeleton {
    display: flex;
    flex-direction: column;
  }

  .skeleton-block {
    background: linear-gradient(120deg, #eef3f7 18%, #f8fbfd 38%, #eef3f7 58%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
    border-radius: 18rpx;
  }

  .hero__title-skeleton {
    width: 220rpx;
    height: 46rpx;
  }

  .hero__meta-skeleton {
    width: 180rpx;
    height: 24rpx;
  }

  .search-bar-skeleton {
    width: 100%;
    height: 72rpx;
    border-radius: 18rpx;
  }

  .search-bar {
    display: flex;
    align-items: center;
    padding: 18rpx 22rpx;
    border-radius: 18rpx;
    background: #f4f7fb;

    &__icon {
      font-size: 30rpx;
      color: #8a94a6;
    }

    &__input {
      flex: 1;
      margin: 0 14rpx;
      font-size: 28rpx;
      color: #263238;
    }

    &__clear {
      font-size: 30rpx;
      color: #a1abba;
    }
  }
  .album-container {
    padding: 8rpx 20rpx 0;
  }

  .waterfall {
    display: flex;
    align-items: flex-start;
    gap: 18rpx;
  }

  .waterfall--skeleton .wallpaper__item {
    pointer-events: none;
  }

  .waterfall__column {
    flex: 1;
    min-width: 0;
  }

  .wallpaper__item {
    margin-bottom: 20rpx;
    background: #ffffff;
    border-radius: 18rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 24rpx rgba(31, 42, 55, 0.05);
  }

  .wallpaper__item--skeleton {
    background: #ffffff;
  }

  .item__image {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #edf1f5;
  }

  .item__data {
    padding: 18rpx 18rpx 20rpx;
  }

  .item__title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item__title-skeleton {
    width: 72%;
    height: 28rpx;
    border-radius: 999rpx;
  }

  .item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    margin-top: 10rpx;
  }

  .item__meta-skeleton {
    width: 120rpx;
    height: 22rpx;
    border-radius: 999rpx;
  }

  .item__meta-skeleton--short {
    width: 88rpx;
  }

  .item__meta-text {
    font-size: 22rpx;
    color: #7d8998;
  }

  .item__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-top: 12rpx;
  }

  .item__tag {
    padding: 6rpx 12rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    color: #4763c7;
    background: #eef3ff;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 160rpx 20rpx 100rpx;

    &__icon {
      font-size: 80rpx;
      color: #d1d6de;
    }

    &__title {
      margin-top: 24rpx;
      font-size: 28rpx;
      color: #8a94a6;
    }
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
