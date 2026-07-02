<template>
  <view class="index">
    <!-- 首页 -->
    <view v-if="tabberPageLoadFlag[0]" :style="{ display: currentTabbarIndex === 0 ? '' : 'none' }">
      <scroll-view class="custom-tabbar-page" scroll-y enable-back-to-top :lower-threshold="100" @scrolltolower="tabbarPageScrollLower">
        <page-a ref="pageA"></page-a>
      </scroll-view>
    </view>
    <!-- 分类 -->
    <view v-if="tabberPageLoadFlag[1]" :style="{ display: currentTabbarIndex === 1 ? '' : 'none' }">
      <scroll-view class="custom-tabbar-page" scroll-y enable-back-to-top @scrolltolower="tabbarPageScrollLower">
        <page-b ref="pageB"></page-b>
      </scroll-view>
    </view>
    <!-- 收藏 -->
    <view v-if="tabberPageLoadFlag[2]" :style="{ display: currentTabbarIndex === 2 ? '' : 'none' }">
      <scroll-view class="custom-tabbar-page" scroll-y enable-back-to-top @scrolltolower="tabbarPageScrollLower">
        <page-c ref="pageC"></page-c>
      </scroll-view>
    </view>
    <!-- 我的 -->
    <view v-if="tabberPageLoadFlag[3]" :style="{ display: currentTabbarIndex === 3 ? '' : 'none' }">
      <scroll-view class="custom-tabbar-page" scroll-y enable-back-to-top @scrolltolower="tabbarPageScrollLower">
        <page-e ref="pageE" @change-tab="changeTabbar"></page-e>
      </scroll-view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tabbar">
      <view class="action" @tap.stop="changeTabbar(0)">
        <view class="bar-icon">
          <view :class="[currentTabbarIndex === 0 ? 'tn-icon-home-fill tn-color-blue' : 'tn-icon-home tn-color-gray']" style="font-size: 44rpx;"></view>
        </view>
        <view :class="[currentTabbarIndex === 0 ? 'tn-color-blue' : 'tn-color-gray']" style="font-size: 22rpx;">首页</view>
      </view>
      <view class="action" @tap.stop="changeTabbar(1)">
        <view class="bar-icon">
          <view :class="[currentTabbarIndex === 1 ? 'tn-icon-discover-fill tn-color-blue' : 'tn-icon-discover tn-color-gray']" style="font-size: 44rpx;"></view>
        </view>
        <view :class="[currentTabbarIndex === 1 ? 'tn-color-blue' : 'tn-color-gray']" style="font-size: 22rpx;">分类</view>
      </view>
      <view class="action" @tap.stop="changeTabbar(2)">
        <view class="bar-icon">
          <view :class="[currentTabbarIndex === 2 ? 'tn-icon-like-fill tn-color-blue' : 'tn-icon-like tn-color-gray']" style="font-size: 44rpx;"></view>
        </view>
        <view :class="[currentTabbarIndex === 2 ? 'tn-color-blue' : 'tn-color-gray']" style="font-size: 22rpx;">收藏</view>
      </view>
      <view class="action" @tap.stop="changeTabbar(3)">
        <view class="bar-icon">
          <view :class="[currentTabbarIndex === 3 ? 'tn-icon-my-fill tn-color-blue' : 'tn-icon-my tn-color-gray']" style="font-size: 44rpx;"></view>
        </view>
        <view :class="[currentTabbarIndex === 3 ? 'tn-color-blue' : 'tn-color-gray']" style="font-size: 22rpx;">我的</view>
      </view>
    </view>
  </view>
</template>

<script>
  import PageA from './component/PageA.vue'
  import PageB from './component/PageB.vue'
  import PageC from './component/PageC.vue'
  import PageE from './component/PageE.vue'

  export default {
    components: {
      PageA,
      PageB,
      PageC,
      PageE
    },
    data() {
      return {
        currentTabbarIndex: 0,
        tabberPageLoadFlag: []
      }
    },
    onLoad(options) {
      const index = Number(options.index || 0)
      // 4个tab页面
      for (let i = 0; i < 4; i++) {
        this.tabberPageLoadFlag.push(i === index)
      }
      this.changeTabbar(index)
    },
    onShow() {
      // 从子页面返回时刷新当前tab数据
      this._refreshCurrentTab()
    },
    methods: {
      tabbarPageScrollLower(e) {
        if (this.currentTabbarIndex === 0) {
          this.$refs.pageA.getRandomData && this.$refs.pageA.getRandomData()
        }
      },
      changeTabbar(index) {
        if (this.currentTabbarIndex === index) {
          // 点击当前tab，刷新数据
          this._refreshTab(index)
          return
        }
        this._switchTabbarPage(index)
        this.currentTabbarIndex = index
        // 切换后刷新目标tab
        this.$nextTick(() => this._refreshTab(index))
      },
      _switchTabbarPage(index) {
        const selectPageFlag = this.tabberPageLoadFlag[index]
        if (selectPageFlag === undefined) return
        if (selectPageFlag === false) {
          this.tabberPageLoadFlag[index] = true
        }
      },
      // 刷新指定tab的数据
      _refreshTab(index) {
        const refs = ['pageA', 'pageB', 'pageC', 'pageE']
        const ref = refs[index]
        if (ref && this.$refs[ref]) {
          const page = this.$refs[ref]
          if (typeof page.loadUserInfo === 'function') {
            page.loadUserInfo()
          }
          if (typeof page.fetchFavorites === 'function') {
            page.fetchFavorites()
          }
          if (typeof page.fetchAlbumList === 'function' && index === 0) {
            // 首页不自动刷新，避免打断浏览
          }
        }
      },
      // 刷新当前tab
      _refreshCurrentTab() {
        this._refreshTab(this.currentTabbarIndex)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .index {
    width: 100%;
    height: 100vh;
    position: relative;

    .custom-tabbar-page {
      width: 100%;
      height: calc(100vh - 110rpx);
      box-sizing: border-box;
      padding-bottom: 0rpx;
      padding-bottom: calc(0rpx + constant(safe-area-inset-bottom));
      padding-bottom: calc(0rpx + env(safe-area-inset-bottom));
    }

    /* 底部导航 */
    .tabbar {
      width: 100%;
      height: 110rpx;
      height: calc(110rpx + constant(safe-area-inset-bottom));
      height: calc(110rpx + env(safe-area-inset-bottom));
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #FFFFFF;
      z-index: 998;
      padding-bottom: calc(constant(safe-area-inset-bottom));
      padding-bottom: calc(env(safe-area-inset-bottom));
      display: flex;
      align-items: center;
      justify-content: space-around;
      box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);

      .action {
        font-size: 22rpx;
        position: relative;
        flex: 1;
        text-align: center;
        padding: 8rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .bar-icon {
          width: 50rpx;
          height: 50rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4rpx;
        }
      }
    }
  }
</style>
