import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

export interface Major {
	id: number;
	code: string;
	long_name: string;
	created_at?: string;
	updated_at?: string;
}

export interface MajorRequest {
	code: string;
	long_name: string;
}

export const majorService = {
	getMajors: async () => {
		return api.get<ApiResponse<{ majors: Major[] }>>('/admin/majors');
	},

	createMajor: async (data: MajorRequest) => {
		return api.post<ApiResponse<{ major: Major }>>('/admin/majors', data);
	},

	updateMajor: async (id: number, data: MajorRequest) => {
		return api.put<ApiResponse<{ major: Major }>>(`/admin/majors/${id}`, data);
	},

	deleteMajor: async (id: number) => {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/majors/${id}`);
	}
};
