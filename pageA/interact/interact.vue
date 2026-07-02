<template>
  <view class="interact-redirect"></view>
</template>

<script>
  export default {
    onLoad() {
      uni.redirectTo({
        url: '/pageA/favorite/favorite'
      })
    }
  }
</script>

<style lang="scss" scoped>
  .interact-redirect {
    min-height: 100vh;
    background: #f8f8f8;
  }
</style>
