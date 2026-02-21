import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

export interface Subject {
	id: number;
	name: string;
	created_at?: string;
	updated_at?: string;
}

export interface CreateSubjectRequest {
	name: string;
}

export interface UpdateSubjectRequest {
	name: string;
}

export const subjectService = {
	getSubjects: async () => {
		return api.get<ApiResponse<{ subjects: Subject[] }>>('/admin/subjects');
	},

	createSubject: async (data: CreateSubjectRequest) => {
		return api.post<ApiResponse<{ subject: Subject }>>('/admin/subjects', data);
	},

	updateSubject: async (id: number, data: UpdateSubjectRequest) => {
		return api.put<ApiResponse<{ message: string }>>(`/admin/subjects/${id}`, data);
	},

	deleteSubject: async (id: number) => {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/subjects/${id}`);
	}
};
