import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

export const mediaService = {
	uploadImage: async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		return api.post<ApiResponse<{ url: string }>>('/admin/media/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
	}
};
