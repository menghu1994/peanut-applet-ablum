/**
 * 统一请求封装 (Vue 2 + Vuex 版本)
 *
 * 功能：
 * 1. 基于 uni.request 封装 Promise 请求
 * 2. 自动读取 network store 的 baseUrl
 * 3. 统一错误处理
 * 4. 支持 GET/POST/PUT/DELETE
 */

import store from '../nxTemp/store';

const REQUEST_CONFIG = {
  timeout: 15000,
  header: {
    'Content-Type': 'application/json'
  },
  dataType: 'json',
  responseType: 'text'
};

function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) return '';
  const parts = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

function getBaseUrl() {
  try {
    return store.getters.apiBaseUrl;
  } catch (e) {
    console.warn('[Request] Store not initialized, using default URL');
    return 'http://localhost:39100';
  }
}

function getUserHeader() {
  try {
    const userInfo = store.state.vuex_user || {};
    if (userInfo.userId) {
      return { 'X-User-Id': userInfo.userId };
    }
    return {};
  } catch (e) {
    return {};
  }
}

async function requestBase(options) {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    timeout = REQUEST_CONFIG.timeout,
    showLoading = false,
    loadingText = '加载中...',
    showError = true
  } = options;

  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true });
  }

  const baseUrl = getBaseUrl();
  const queryString = buildQueryString(params);
  const fullUrl = `${baseUrl}${url}${queryString}`;

  const requestHeader = {
    ...REQUEST_CONFIG.header,
    ...getUserHeader(),
    ...header
  };

  console.log(`[Request] ${method} ${fullUrl}`);

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout,
      dataType: REQUEST_CONFIG.dataType,
      responseType: REQUEST_CONFIG.responseType,
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const responseData = res.data;
          if (responseData.code === 0) {
            resolve(responseData);
          } else {
            if (showError) {
              uni.showToast({ title: responseData.msg || '请求失败', icon: 'none' });
            }
            reject(responseData);
          }
        } else if (res.statusCode === 401) {
          uni.showToast({ title: '登录已过期', icon: 'none' });
          reject(res.data);
        } else if (res.statusCode === 403) {
          uni.showToast({ title: '没有访问权限', icon: 'none' });
          reject(res.data);
        } else if (res.statusCode === 404) {
          if (showError) {
            uni.showToast({ title: '请求的资源不存在', icon: 'none' });
          }
          reject(res.data);
        } else if (res.statusCode >= 500) {
          if (showError) {
            uni.showToast({ title: '服务器繁忙', icon: 'none' });
          }
          reject(res.data);
        } else {
          if (showError) {
            uni.showToast({ title: `请求失败 (${res.statusCode})`, icon: 'none' });
          }
          reject(res.data);
        }
      },
      fail: (err) => {
        console.error('[Request] Failed:', err);
        if (showLoading) uni.hideLoading();

        const errMsg = err.errMsg || '';
        if (errMsg.includes('timeout')) {
          if (showError) uni.showToast({ title: '请求超时', icon: 'none' });
        } else {
          if (showError) uni.showToast({ title: '网络连接失败', icon: 'none' });
        }
        reject(err);
      },
      complete: () => {
        if (showLoading) uni.hideLoading();
      }
    });
  });
}

export const request = {
  get(url, params, options) {
    return requestBase({ url, method: 'GET', params, ...options });
  },
  post(url, data, options) {
    return requestBase({ url, method: 'POST', data, ...options });
  },
  put(url, data, options) {
    return requestBase({ url, method: 'PUT', data, ...options });
  },
  delete(url, data, options) {
    return requestBase({ url, method: 'DELETE', data, ...options });
  }
};

export default request;
