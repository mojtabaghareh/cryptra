import { apiGet } from '../lib/api';

export async function fetchActivity(token: string) {
  return apiGet<{ success: boolean; data: unknown }>('/api/v1/activity', token);
}
