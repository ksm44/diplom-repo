import { apiGet } from './api';

export function getMovies() {
  return apiGet('/movies');
}