/**
 * 网络模式管理 Store (Vuex Module)
 *
 * 功能：
 * 1. 静默探测内网服务连通性
 * 2. 根据探测结果自动选择内网/外网模式
 * 3. 提供全局 baseUrl
 * 4. 定时刷新网络模式
 */

import { BASE_URL } from '@/env';

// 网络配置
const DEFAULT_NETWORK_CONFIG = {
  intranet: {
    apiBaseUrl: 'http://192.168.1.100:39100',
    mediaBaseUrl: 'http://192.168.1.100:39100/media/assets',
    label: '内网模式'
  },
  internet: {
    apiBaseUrl: BASE_URL,
    mediaBaseUrl: `${BASE_URL}/media/assets`,
    label: '外网模式'
  }
};

const STORAGE_KEY = 'photo_wechat_network_config_v2';
const INTRANET_PROBE_TIMEOUT = 800;
const NETWORK_CONFIG_TIMEOUT = 1200;
const NETWORK_PROBE_INTERVAL = 30000;

let probeTimer = null;

export const state = {
  networkConfig: { ...DEFAULT_NETWORK_CONFIG },
  networkMode: 'internet', // 'intranet' | 'internet'
  isDetecting: false
};

export const getters = {
  apiBaseUrl(state) {
    return state.networkConfig[state.networkMode].apiBaseUrl;
  },
  mediaBaseUrl(state) {
    return state.networkConfig[state.networkMode].mediaBaseUrl;
  },
  networkLabel(state) {
    return state.networkConfig[state.networkMode].label;
  }
};

export const mutations = {
  setNetworkMode(state, mode) {
    state.networkMode = mode;
  },
  setDetecting(state, val) {
    state.isDetecting = val;
  },
  setNetworkConfig(state, config) {
    state.networkConfig = {
      intranet: { ...DEFAULT_NETWORK_CONFIG.intranet, ...(config.intranet || {}), label: '内网模式' },
      internet: { ...DEFAULT_NETWORK_CONFIG.internet, ...(config.internet || {}), label: '外网模式' }
    };
  }
};

export const actions = {
  async initNetworkMode({ dispatch, commit }) {
    console.log('[NetworkStore] 初始化网络模式...');
    dispatch('loadNetworkConfigFromLocal');
    await dispatch('refreshNetworkConfig');
    await dispatch('detectNetwork');
    dispatch('startNetworkProbe');
  },

  async detectNetwork({ state, commit, dispatch }) {
    if (state.isDetecting) return;
    commit('setDetecting', true);

    try {
      const isIntranetReachable = await dispatch('pingIntranet');
      commit('setNetworkMode', isIntranetReachable ? 'intranet' : 'internet');
      console.log(`[NetworkStore] 网络模式: ${state.networkMode}`);
    } catch (error) {
      console.error('[NetworkStore] 网络探测异常:', error);
      commit('setNetworkMode', 'internet');
    } finally {
      commit('setDetecting', false);
    }
  },

  startNetworkProbe({ dispatch }) {
    if (probeTimer) return;
    probeTimer = setInterval(() => {
      dispatch('detectNetwork');
    }, NETWORK_PROBE_INTERVAL);
  },

  stopNetworkProbe() {
    if (!probeTimer) return;
    clearInterval(probeTimer);
    probeTimer = null;
  },

  pingIntranet({ state }) {
    const intranetConfig = state.networkConfig.intranet;
    const testUrl = `${intranetConfig.apiBaseUrl}/api/media/config/network`;

    return new Promise((resolve) => {
      uni.request({
        url: testUrl,
        method: 'GET',
        timeout: INTRANET_PROBE_TIMEOUT,
        success: (res) => {
          resolve(res.statusCode === 200);
        },
        fail: () => resolve(false)
      });
    });
  },

  loadNetworkConfigFromLocal({ commit }) {
    try {
      const saved = uni.getStorageSync(STORAGE_KEY);
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        commit('setNetworkConfig', parsed);
      }
    } catch (e) {
      console.warn('[NetworkStore] 本地配置解析失败:', e);
    }
  },

  async refreshNetworkConfig({ state, commit, dispatch }) {
    const candidates = [
      state.networkConfig.intranet.apiBaseUrl,
      state.networkConfig.internet.apiBaseUrl,
      DEFAULT_NETWORK_CONFIG.intranet.apiBaseUrl
    ];
    const unique = [...new Set(candidates)];

    for (const baseUrl of unique) {
      const remoteConfig = await dispatch('fetchNetworkConfigFrom', baseUrl);
      if (remoteConfig) {
        commit('setNetworkConfig', remoteConfig);
        try {
          uni.setStorageSync(STORAGE_KEY, JSON.stringify(state.networkConfig));
        } catch (e) {}
        console.log('[NetworkStore] 已同步后端网络配置');
        return;
      }
    }
  },

  fetchNetworkConfigFrom(_, baseUrl) {
    return new Promise((resolve) => {
      uni.request({
        url: `${baseUrl}/api/media/config/network`,
        method: 'GET',
        timeout: NETWORK_CONFIG_TIMEOUT,
        success: (res) => {
          if (res.statusCode === 200 && res.data?.code === 0 && res.data?.data) {
            resolve(res.data.data);
          } else {
            resolve(null);
          }
        },
        fail: () => resolve(null)
      });
    });
  }
};
