export function resolveAlbumMediaUrl(mediaBaseUrl, url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${String(mediaBaseUrl || '').replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`
}

export function buildAlbumDetailUrl(item, mediaBaseUrl = '') {
  const imageUrl = resolveAlbumMediaUrl(mediaBaseUrl, item.displayUrl || item.url || item.resourceCover || '')
  const thumbUrl = resolveAlbumMediaUrl(mediaBaseUrl, item.thumbnailUrl || '')
  const categoryName = item.categoryName || item.category || ''
  const location = item.location || ''
  const people = Array.isArray(item.people) ? item.people.join(',') : ''
  const tags = Array.isArray(item.tags) ? item.tags.join(',') : ''
  const takenAt = item.takenAt || item.modifiedAt || ''
  const photoId = item.resourceId || item.id || ''

  return `/pageA/details/details?id=${photoId}&name=${encodeURIComponent(item.name || item.resourceName || '')}&url=${encodeURIComponent(imageUrl)}&thumb=${encodeURIComponent(thumbUrl)}&cat=${encodeURIComponent(categoryName)}&w=${item.width || 0}&h=${item.height || 0}&size=${item.size || 0}&location=${encodeURIComponent(location)}&people=${encodeURIComponent(people)}&tags=${encodeURIComponent(tags)}&takenAt=${encodeURIComponent(takenAt)}`
}

function openAlbumPermissionSetting() {
  uni.showModal({
    title: '需要相册权限',
    content: '保存图片需要访问系统相册，请在设置中打开相册权限。',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({})
      }
    }
  })
}

export function saveImageToAlbumWithPermission(imageUrl, loadingTitle = '下载中...') {
  if (!imageUrl) {
    return Promise.resolve(false)
  }

  uni.showLoading({ title: loadingTitle })

  return new Promise((resolve) => {
    uni.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode !== 200) {
          uni.hideLoading()
          uni.showToast({ title: '下载失败', icon: 'none' })
          resolve(false)
          return
        }

        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.hideLoading()
            uni.showToast({ title: '已保存到相册', icon: 'success' })
            resolve(true)
          },
          fail: (err) => {
            uni.hideLoading()
            const errMsg = err && err.errMsg ? err.errMsg : ''
            const denied = errMsg && (errMsg.includes('deny') || errMsg.includes('denied') || errMsg.includes('auth'))
            if (denied) {
              openAlbumPermissionSetting()
            } else {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
            resolve(false)
          }
        })
      },
      fail: () => {
        uni.hideLoading()
        uni.showToast({ title: '下载失败', icon: 'none' })
        resolve(false)
      }
    })
  })
}
