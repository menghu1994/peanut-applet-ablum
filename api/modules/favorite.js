/**
 * 收藏接口
 */
import { request } from '../request';

export function getFavoriteList(params) {
  return request.get('/api/media/favorites', params);
}

export function addFavorite(data) {
  return request.post('/api/media/favorites', data);
}

export function removeFavorite(id) {
  return request.delete(`/api/media/favorites/${id}`);
}
