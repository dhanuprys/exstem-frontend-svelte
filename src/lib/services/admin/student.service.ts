import { api } from '$lib/utils/api';
import type { ApiResponse, Pagination } from '../../types/api';

export interface Student {
	id: number;
	nis: string;
	nisn: string;
	name: string;
	gender: string;
	religion: string;
	class_id: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreateStudentRequest {
	nis: string;
	nisn: string;
	name: string;
	gender: string;
	religion: string;
	password?: string;
	class_id: number;
}

class StudentService {
	/**
	 * Create a new student
	 */
	public async createStudent(data: CreateStudentRequest) {
		return api.post<ApiResponse<{ student: Student }>>('/admin/students', data);
	}

	/**
	 * Update an existing student
	 */
	public async updateStudent(id: number, data: CreateStudentRequest) {
		return api.put<ApiResponse<{ student: Student }>>(`/admin/students/${id}`, data);
	}

	/**
	 * Get all the students for the admin
	 */
	public async getStudents(page: number = 1, perPage: number = 10, classId?: number) {
		let url = `/admin/students?page=${page}&per_page=${perPage}`;
		if (classId) {
			url += `&class_id=${classId}`;
		}
		return api.get<ApiResponse<{ students: Student[]; pagination: Pagination }>>(url);
	}

	/**
	 * Delete a student
	 */
	public async deleteStudent(id: number) {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/students/${id}`);
	}

	/**
	 * Reset a student's session (force logout from other devices)
	 */
	public async resetSession(id: number) {
		return api.post<ApiResponse<{ message: string }>>(`/admin/students/${id}/reset-session`);
	}
}

export const studentService = new StudentService();
