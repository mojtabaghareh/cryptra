import { apiGet } from '../lib/api';

export async function fetchMe(token: string) {
  return apiGet<{ success: boolean; data: unknown }>('/api/v1/users/me', token);
}
