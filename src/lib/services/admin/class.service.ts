import { api } from '$lib/utils/api';
import type { ApiResponse } from '../../types/api';

export interface Class {
	id: number;
	grade_level: string;
	major_code: string;
	group_number: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreateClassRequest {
	grade_level: string;
	major_code: string;
	group_number: number;
}

class ClassService {
	/**
	 * Create a new class
	 */
	public async createClass(data: CreateClassRequest) {
		return api.post<ApiResponse<{ class: Class }>>('/admin/classes', data);
	}

	/**
	 * Update an existing class
	 */
	public async updateClass(id: number, data: CreateClassRequest) {
		return api.put<ApiResponse<{ class: Class }>>(`/admin/classes/${id}`, data);
	}

	/**
	 * Get all the classes for the admin
	 */
	public async getClasses() {
		return api.get<ApiResponse<{ classes: Class[] }>>('/admin/classes');
	}

	/**
	 * Delete a class
	 */
	public async deleteClass(id: number) {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/classes/${id}`);
	}
}

export const classService = new ClassService();
