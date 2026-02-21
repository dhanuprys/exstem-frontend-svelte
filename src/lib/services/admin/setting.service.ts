import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

export interface AppSetting {
	key: string;
	value: string;
	updated_at?: string;
}

export interface UpdateSettingsRequest {
	settings: Record<string, string>;
}

export const settingService = {
	getSettings: async () => {
		return api.get<ApiResponse<{ settings: Record<string, string> }>>('/admin/settings');
	},

	updateSettings: async (data: UpdateSettingsRequest) => {
		return api.put<ApiResponse<{ message: string }>>('/admin/settings', data);
	},

	getPublicSettings: async () => {
		return api.get<ApiResponse<{ settings: Record<string, string> }>>('/public/settings');
	}
};
