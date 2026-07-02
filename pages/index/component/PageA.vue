<template>
  <view class="page-a">
    <view class="hero" :style="{ paddingTop: `${(vuex_status_bar_height || 0) + 24}px` }">
      <view class="hero__copy">
        <text class="hero__title">花生拾光</text>
        <text class="hero__meta">{{ totalLabel }}</text>
      </view>
      <view class="hero__action" @tap="resetFilters">
        <text class="tn-icon-refresh"></text>
      </view>
    </view>

    <view class="search-panel">
      <view class="search-bar">
        <text class="tn-icon-search search-bar__icon"></text>
        <input
          v-model.trim="keyword"
          class="search-bar__input"
          placeholder="搜索照片、地点、人物或标签"
          confirm-type="search"
          @confirm="searchAlbums"
        />
        <text v-if="keyword" class="tn-icon-close-circle search-bar__clear" @tap.stop="clearKeyword"></text>
      </view>

      <view class="filters">
        <picker mode="selector" :range="timeOptions" range-key="label" @change="onFilterPickerChange('time', $event)">
          <view class="filter-pill" :class="{ 'filter-pill--active': selectedFilters.time !== 'all' }">
            <text class="tn-icon-time filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('time') }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="categoryOptions" range-key="label" @change="onFilterPickerChange('category', $event)">
          <view class="filter-pill" :class="{ 'filter-pill--active': selectedFilters.category !== 'all' }">
            <text class="tn-icon-app filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('category') }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="locationOptions" range-key="label" @change="onFilterPickerChange('location', $event)">
          <view class="filter-pill" :class="{ 'filter-pill--active': !!selectedFilters.location }">
            <text class="tn-icon-location filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('location') }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="personOptions" range-key="label" @change="onFilterPickerChange('person', $event)">
          <view class="filter-pill" :class="{ 'filter-pill--active': !!selectedFilters.person }">
            <text class="tn-icon-my filter-pill__icon"></text>
            <text class="filter-pill__label">{{ getFilterLabel('person') }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="tagOptions" range-key="label" @change="onFilterPickerChange('tag', $event)">
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
      <tn-waterfall ref="waterfall" v-model="displayList" @finish="handleWaterFallFinish">
        <template v-slot:left="{ leftList }">
          <view v-for="item in leftList" :key="item.id" class="wallpaper__item" @click="goDetail(item)">
            <view class="item__image">
              <tn-lazy-load :threshold="1600" height="100%" :image="getImageUrl(item)" :index="item.id" imgMode="widthFix"></tn-lazy-load>
            </view>
            <view class="item__data">
              <text class="item__title tn-color-black">{{ item.name }}</text>
              <view class="item__meta">
                <text class="item__meta-text">{{ item.categoryName || item.category }}</text>
                <text v-if="item.location" class="item__meta-text">{{ item.location }}</text>
              </view>
              <view v-if="item.people && item.people.length" class="item__tags">
                <text v-for="person in item.people.slice(0, 2)" :key="person" class="item__tag">{{ person }}</text>
              </view>
            </view>
          </view>
        </template>

        <template v-slot:right="{ rightList }">
          <view v-for="item in rightList" :key="item.id" class="wallpaper__item" @click="goDetail(item)">
            <view class="item__image">
              <tn-lazy-load :threshold="1600" height="100%" :image="getImageUrl(item)" :index="item.id" imgMode="widthFix"></tn-lazy-load>
            </view>
            <view class="item__data">
              <text class="item__title tn-color-black">{{ item.name }}</text>
              <view class="item__meta">
                <text class="item__meta-text">{{ item.categoryName || item.category }}</text>
                <text v-if="item.location" class="item__meta-text">{{ item.location }}</text>
              </view>
              <view v-if="item.people && item.people.length" class="item__tags">
                <text v-for="person in item.people.slice(0, 2)" :key="person" class="item__tag">{{ person }}</text>
              </view>
            </view>
          </view>
        </template>
      </tn-waterfall>

      <view v-if="!displayList.length && loadStatus !== 'loading'" class="empty-state">
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
    category: { label: '全部分类', value: 'all' },
    location: { label: '全部地点', value: '' },
    person: { label: '全部人物', value: '' },
    tag: { label: '全部标签', value: '' }
  }

  export default {
    name: 'PagesA',
    data() {
      return {
        keyword: '',
        timeOptions: [
          { label: '全部时间', value: 'all', days: 0 },
          { label: '近7天', value: '7d', days: 7 },
          { label: '近30天', value: '30d', days: 30 },
          { label: '近90天', value: '90d', days: 90 },
          { label: '近1年', value: '365d', days: 365 }
        ],
        filterOptions: {
          categories: [DEFAULT_OPTION.category],
          locations: [DEFAULT_OPTION.location],
          people: [DEFAULT_OPTION.person],
          tags: [DEFAULT_OPTION.tag]
        },
        selectedFilters: {
          time: 'all',
          category: 'all',
          location: '',
          person: '',
          tag: ''
        },
        albumList: [],
        displayList: [],
        page: 1,
        pageSize: 20,
        total: 0,
        loadStatus: 'loadmore',
        appendTaskId: 0,
        appendTimer: null
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
      personOptions() {
        return this.filterOptions.people
      },
      tagOptions() {
        return this.filterOptions.tags
      },
      activeFilterCount() {
        return [
          this.selectedFilters.time !== 'all',
          this.selectedFilters.category !== 'all',
          !!this.selectedFilters.location,
          !!this.selectedFilters.person,
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
    beforeDestroy() {
      this.clearAppendTimer()
    },
    methods: {
      getImageUrl(item) {
        return resolveAlbumMediaUrl(this.mediaBaseUrl, item.thumbnailUrl || item.displayUrl || item.url)
      },

      getFilterLabel(type) {
        const map = {
          time: this.timeOptions,
          category: this.categoryOptions,
          location: this.locationOptions,
          person: this.personOptions,
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

          this.filterOptions.categories = this.buildOptions(res.data.categories, DEFAULT_OPTION.category)
          this.filterOptions.locations = this.buildOptions(res.data.locations, DEFAULT_OPTION.location, false)
          this.filterOptions.people = this.buildOptions(res.data.people, DEFAULT_OPTION.person, false)
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
                value: item.value !== undefined && item.value !== null
                  ? item.value
                  : (item.label !== undefined && item.label !== null ? item.label : fallbackOption.value)
              }
            }

            return {
              label: item || fallbackOption.label,
              value: item || fallbackOption.value
            }
          })
          .filter((item) => item.label)

        const firstValue = fallbackOption.value
        const deduped = normalized.filter((item, index) => normalized.findIndex((entry) => entry.value === item.value) === index)
        const hasFallback = deduped.some((item) => item.value === firstValue)
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

        if (this.selectedFilters.person) {
          params.person = this.selectedFilters.person
        }

        if (this.selectedFilters.tag) {
          params.tag = this.selectedFilters.tag
        }

        const timeOption = this.timeOptions.find((item) => item.value === this.selectedFilters.time)
        if (timeOption && timeOption.days > 0) {
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          start.setDate(start.getDate() - timeOption.days + 1)
          params.startTime = start.toISOString()
        }

        return params
      },

      async fetchAlbumList(reset = false) {
        if (this.loadStatus === 'loading') return

        if (reset) {
          this.page = 1
          this.albumList = []
          this.displayList = []
          this.clearAppendTimer()
        }

        this.loadStatus = 'loading'

        try {
          const res = await getAlbumList(this.buildQueryParams())
          if (res.code !== 0) {
            this.loadStatus = 'loadmore'
            return
          }

          const newData = res.data || []
          this.albumList = reset ? newData : [...this.albumList, ...newData]
          this.total = (res.pagination && res.pagination.total) || this.albumList.length
          const nextStatus = this.albumList.length >= this.total ? 'nomore' : 'loadmore'
          this.applyWaterfallData(newData, { reset, nextStatus })
        } catch (e) {
          console.error('获取相册列表失败:', e)
          if (!reset && this.page > 1) {
            this.page -= 1
          }
          this.loadStatus = 'loadmore'
        }
      },

      applyWaterfallData(data, { reset, nextStatus }) {
        this.clearAppendTimer()

        const queue = (Array.isArray(data) ? data : []).map((item, index) => ({
          ...item,
          id: item.id || `album_${Date.now()}_${index}`
        }))

        if (reset) {
          this.displayList = []
        }

        if (!queue.length) {
          this.loadStatus = nextStatus
          return
        }

        const taskId = Date.now()
        this.appendTaskId = taskId

        const appendChunk = () => {
          if (this.appendTaskId !== taskId) return

          const chunk = queue.splice(0, 8)
          if (chunk.length) {
            this.displayList = [...this.displayList, ...chunk]
          }

          if (queue.length) {
            this.appendTimer = setTimeout(appendChunk, 16)
            return
          }

          this.appendTimer = null
          this.loadStatus = nextStatus
        }

        appendChunk()
      },

      clearAppendTimer() {
        this.appendTaskId = 0
        if (this.appendTimer) {
          clearTimeout(this.appendTimer)
          this.appendTimer = null
        }
      },

      onFilterPickerChange(type, event) {
        const index = Number(event && event.detail ? event.detail.value : 0)
        const optionsMap = {
          time: this.timeOptions,
          category: this.categoryOptions,
          location: this.locationOptions,
          person: this.personOptions,
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
          person: '',
          tag: ''
        }
        this.fetchAlbumList(true)
      },

      handleWaterFallFinish() {
        if (this.loadStatus === 'loading' && !this.appendTimer) {
          this.loadStatus = this.albumList.length >= this.total ? 'nomore' : 'loadmore'
        }
      },

      goDetail(item) {
        uni.navigateTo({
          url: buildAlbumDetailUrl(item, this.mediaBaseUrl)
        })
      },

      getRandomData() {
        if (this.loadStatus === 'loading' || this.loadStatus === 'nomore') return
        this.page += 1
        this.fetchAlbumList()
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
      width: 72rpx;
      height: 72rpx;
      border-radius: 20rpx;
      background: rgba(255, 255, 255, 0.86);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34rpx;
      color: #4c6fff;
      box-shadow: 0 10rpx 24rpx rgba(76, 111, 255, 0.08);
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
    padding: 8rpx 14rpx 0;
  }

  .wallpaper__item {
    margin: 0 10rpx 20rpx;
    background: #ffffff;
    border-radius: 18rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 24rpx rgba(31, 42, 55, 0.05);
  }

  .item__image {
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
