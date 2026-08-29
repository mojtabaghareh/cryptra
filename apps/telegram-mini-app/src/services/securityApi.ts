import { apiGet } from '../lib/api';

export async function fetchSecurityStatus(token: string) {
  return apiGet<{ success: boolean; data: unknown }>('/api/v1/security/status', token);
}
