import { apiGet } from '../lib/api';

export async function fetchAdminHealth(token: string) {
  return apiGet<{ success: boolean; data: unknown }>('/api/v1/admin/health', token);
}
