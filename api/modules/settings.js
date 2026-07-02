/**
 * 用户设置接口
 */
import { request } from '../request';

export function getSettings() {
  return request.get('/api/media/settings');
}

export function updateSettings(data) {
  return request.put('/api/media/settings', data, { showError: false });
}
