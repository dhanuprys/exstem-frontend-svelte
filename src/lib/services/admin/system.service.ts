import { api } from '$lib/utils/api';
import { STORAGE_KEYS } from '$lib/utils/constants';

class SystemService {
	/**
	 * Get the SSE URL for streaming system metrics.
	 * Uses query-param auth since EventSource cannot send headers.
	 */
	public getMetricsSseUrl(): string {
		const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
		const baseURL = api.defaults.baseURL;
		return `${baseURL}/admin/system/metrics?token=${token}`;
	}
}

export const systemService = new SystemService();
