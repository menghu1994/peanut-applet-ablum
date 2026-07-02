<template>
  <view class="page-a">
    <view class="hero" :style="{ paddingTop: `${(vuex_status_bar_height || 0) + 24}px` }">
      <view class="hero__copy">
        <text class="hero__title">照片拾光</text>
        <text class="hero__meta">{{ totalLabel }}</text>
      </view>
      <view class="hero__action" @tap="resetFilters">
        <text class="hero__action-text">重置</text>
      </view>
    </view>

    <view class="search-panel">
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

      <view class="filters">
        <picker
          v-if="timeOptions.length > 1"
          mode="selector"
          :range="timeOptions"
          range-key="label"
          @change="onFilterPickerChange('time', $event)"
        >
          <view class="filter-pill" :class="{ 'filter-pill--active': selectedFilters.time !== 'all' }">
            <text class="tn-icon-time filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('time') }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="categoryOptions" range-key="label" @change="onFilterPickerChange('category', $event)">
          <view class="filter-pill" :class="{ 'filter-pill--active': selectedFilters.category !== 'all' }">
            <text class="tn-icon-image-text filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('category') }}</text>
          </view>
        </picker>

        <picker
          v-if="locationOptions.length > 1"
          mode="selector"
          :range="locationOptions"
          range-key="label"
          @change="onFilterPickerChange('location', $event)"
        >
          <view class="filter-pill" :class="{ 'filter-pill--active': !!selectedFilters.location }">
            <text class="tn-icon-location filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('location') }}</text>
          </view>
        </picker>

        <picker
          v-if="tagOptions.length > 1"
          mode="selector"
          :range="tagOptions"
          range-key="label"
          @change="onFilterPickerChange('tag', $event)"
        >
          <view class="filter-pill" :class="{ 'filter-pill--active': !!selectedFilters.tag }">
            <text class="tn-icon-tag filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('tag') }}</text>
          </view>
        </picker>
      </view>

      <view class="filters-meta">
        <text class="filters-meta__text">{{ activeFilterSummary }}</text>
        <text v-if="activeFilterCount" class="filters-meta__reset" @tap="resetFilters">清空</text>
      </view>
    </view>

    <view class="album-container">
      <view v-if="waterfall.left.length || waterfall.right.length" class="waterfall">
        <view class="waterfall__column">
          <view v-for="item in waterfall.left" :key="item.id" class="wallpaper__item" @tap="goDetail(item)">
            <view class="item__image">
              <view v-if="getMediaBadge(item)" class="item__badge">{{ getMediaBadge(item) }}</view>
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
              <view v-if="getMediaBadge(item)" class="item__badge">{{ getMediaBadge(item) }}</view>
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

      <tn-load-more :status="loadStatus"></tn-load-more>
    </view>
  </view>
</template>

<script>
  import { getAlbumFilters, getAlbumList } from '@/api/modules/album.js'
  import store from '@/nxTemp/store/index.js'
  import { buildAlbumDetailUrl, resolveAlbumMediaUrl } from '@/libs/album/utils.js'

  const DEFAULT_OPTION = {
    time: { label: '全部日期', value: 'all' },
    category: { label: '全部分类', value: 'all' },
    location: { label: '全部地点', value: '' },
    tag: { label: '全部标签', value: '' }
  }

  export default {
    name: 'PagesA',
    data() {
      return {
        keyword: '',
        timeOptions: [DEFAULT_OPTION.time],
        filterOptions: {
          categories: [DEFAULT_OPTION.category],
          locations: [DEFAULT_OPTION.location],
          tags: [DEFAULT_OPTION.tag]
        },
        selectedFilters: {
          time: 'all',
          category: 'all',
          location: '',
          tag: ''
        },
        albumList: [],
        waterfall: {
          left: [],
          right: []
        },
        waterfallHeight: {
          left: 0,
          right: 0
        },
        page: 1,
        pageSize: 20,
        total: 0,
        loadStatus: 'loadmore'
      }
    },
    computed: {
      mediaBaseUrl() {
        return store.getters.mediaBaseUrl
      },
      categoryOptions() {
        return this.filterOptions.categories
      },
      locationOptions() {
        return this.filterOptions.locations
      },
      tagOptions() {
        return this.filterOptions.tags
      },
      activeFilterCount() {
        return [
          this.selectedFilters.time !== 'all',
          this.selectedFilters.category !== 'all',
          !!this.selectedFilters.location,
          !!this.selectedFilters.tag,
          !!this.keyword
        ].filter(Boolean).length
      },
      activeFilterSummary() {
        if (!this.activeFilterCount) {
          return '全部照片'
        }
        return `已启用 ${this.activeFilterCount} 项筛选`
      },
      totalLabel() {
        return this.total ? `${this.total} 张照片` : '整理中的回忆'
      }
    },
    created() {
      this.fetchFilterOptions()
      this.fetchAlbumList(true)
    },
    methods: {
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

      getFilterLabel(type) {
        const map = {
          time: this.timeOptions,
          category: this.categoryOptions,
          location: this.locationOptions,
          tag: this.tagOptions
        }
        const options = map[type] || []
        const value = this.selectedFilters[type]
        const current = options.find((item) => item.value === value)
        return current ? current.label : ((options[0] && options[0].label) || '')
      },

      async fetchFilterOptions() {
        try {
          const res = await getAlbumFilters()
          if (res.code !== 0 || !res.data) return

          this.timeOptions = this.buildOptions(res.data.dates, DEFAULT_OPTION.time, false)
          this.filterOptions.categories = this.buildOptions(res.data.categories, DEFAULT_OPTION.category)
          this.filterOptions.locations = this.buildOptions(res.data.locations, DEFAULT_OPTION.location, false)
          this.filterOptions.tags = this.buildOptions(res.data.tags, DEFAULT_OPTION.tag, false)
        } catch (e) {
          console.error('获取筛选项失败:', e)
        }
      },

      buildOptions(source, fallbackOption, objectValue = true) {
        const list = Array.isArray(source) ? source : []
        const normalized = list
          .map((item) => {
            if (objectValue && item && typeof item === 'object') {
              return {
                label: item.label || item.value || fallbackOption.label,
                value:
                  item.value !== undefined && item.value !== null
                    ? item.value
                    : item.label !== undefined && item.label !== null
                      ? item.label
                      : fallbackOption.value
              }
            }

            return {
              label: item || fallbackOption.label,
              value: item || fallbackOption.value
            }
          })
          .filter((item) => item.label)

        const deduped = normalized.filter(
          (item, index) => normalized.findIndex((entry) => entry.value === item.value) === index
        )
        const hasFallback = deduped.some((item) => item.value === fallbackOption.value)
        return hasFallback ? deduped : [fallbackOption, ...deduped]
      },

      buildQueryParams() {
        const params = {
          page: this.page,
          pageSize: this.pageSize
        }

        if (this.keyword) {
          params.keyword = this.keyword
        }

        if (this.selectedFilters.category && this.selectedFilters.category !== 'all') {
          params.category = this.selectedFilters.category
        }

        if (this.selectedFilters.location) {
          params.location = this.selectedFilters.location
        }

        if (this.selectedFilters.tag) {
          params.tag = this.selectedFilters.tag
        }

        if (this.selectedFilters.time && this.selectedFilters.time !== 'all') {
          const start = new Date(`${this.selectedFilters.time}T00:00:00`)
          const end = new Date(`${this.selectedFilters.time}T23:59:59`)
          params.startTime = start.toISOString()
          params.endTime = end.toISOString()
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

      onFilterPickerChange(type, event) {
        const index = Number(event && event.detail ? event.detail.value : 0)
        const optionsMap = {
          time: this.timeOptions,
          category: this.categoryOptions,
          location: this.locationOptions,
          tag: this.tagOptions
        }
        const options = optionsMap[type] || []
        const selected = options[index]
        if (!selected) return

        this.selectedFilters[type] = selected.value
        this.fetchAlbumList(true)
      },

      searchAlbums() {
        this.fetchAlbumList(true)
      },

      clearKeyword() {
        if (!this.keyword) return
        this.keyword = ''
        this.fetchAlbumList(true)
      },

      resetFilters() {
        this.keyword = ''
        this.selectedFilters = {
          time: 'all',
          category: 'all',
          location: '',
          tag: ''
        }
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
    justify-content: space-between;
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

    &__action {
      min-width: 88rpx;
      height: 72rpx;
      padding: 0 18rpx;
      border-radius: 20rpx;
      background: rgba(255, 255, 255, 0.86);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10rpx 24rpx rgba(76, 111, 255, 0.08);
    }

    &__action-text {
      font-size: 24rpx;
      font-weight: 600;
      color: #4c6fff;
    }
  }

  .search-panel {
    margin: 0 24rpx 20rpx;
    padding: 24rpx;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 24rpx;
    box-shadow: 0 12rpx 36rpx rgba(31, 42, 55, 0.06);
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

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 20rpx;
  }

  .filter-pill {
    min-width: 196rpx;
    max-width: 100%;
    padding: 16rpx 18rpx;
    border-radius: 18rpx;
    background: #f6f8fc;
    display: flex;
    align-items: center;
    gap: 10rpx;

    &--active {
      background: #eaf0ff;
      color: #2f62ff;
    }

    &__icon {
      font-size: 24rpx;
    }

    &__label {
      flex: 1;
      font-size: 24rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .filters-meta {
    margin-top: 18rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__text {
      font-size: 24rpx;
      color: #8a94a6;
    }

    &__reset {
      font-size: 24rpx;
      color: #4c6fff;
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

  .item__image {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #edf1f5;
  }

  .item__badge {
    position: absolute;
    top: 14rpx;
    right: 14rpx;
    z-index: 2;
    padding: 6rpx 12rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    line-height: 1;
    color: #ffffff;
    background: rgba(31, 42, 55, 0.72);
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

  .item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    margin-top: 10rpx;
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
</style>
