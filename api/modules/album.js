/**
 * 相册资源接口
 */
import { request } from '../request';

export function getAlbumList(params) {
  return request.get('/api/media/albums', params);
}

export function getAlbumCategories() {
  return request.get('/api/media/albums/categories');
}

export function getAlbumFilters() {
  return request.get('/api/media/albums/filters');
}
