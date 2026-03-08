import { api } from '$lib/utils/api';
import type { ApiResponse, Pagination } from '../../types/api';

export interface Student {
	id: number;
	nis: string;
	nisn: string;
	name: string;
	gender: string;
	religion: string;
	password?: string;
	class_id: number;
	created_at?: string;
	updated_at?: string;
}

export interface StudentCardInfo {
	id: number;
	nis: string;
	nisn: string;
	name: string;
	password?: string;
	class_name: string;
	grade_level: string;
	major_name: string;
	room_name?: string;
	seat_number?: number;
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
	public async getStudents(
		page: number = 1,
		perPage: number = 10,
		filters?: {
			classId?: number;
			search?: string;
			religion?: string;
			gradeLevel?: string;
			majorCode?: string;
			groupNumber?: string;
		}
	) {
		const params = new URLSearchParams();
		params.append('page', page.toString());
		params.append('per_page', perPage.toString());

		if (filters) {
			if (filters.classId) params.append('class_id', filters.classId.toString());
			if (filters.search) params.append('search', filters.search);
			if (filters.religion) params.append('religion', filters.religion);
			if (filters.gradeLevel) params.append('grade_level', filters.gradeLevel);
			if (filters.majorCode) params.append('major_code', filters.majorCode);
			if (filters.groupNumber) params.append('group_number', filters.groupNumber);
		}

		const queryString = params.toString();
		const url = `/admin/students?${queryString}`;

		return api.get<ApiResponse<{ students: Student[]; pagination: Pagination }>>(url);
	}

	/**
	 * Get student cards data
	 */
	public async getStudentCards(classId?: number, gradeLevel?: string, majorCode?: string) {
		const params = new URLSearchParams();
		if (classId) params.append('class_id', classId.toString());
		if (gradeLevel) params.append('grade_level', gradeLevel);
		if (majorCode) params.append('major_code', majorCode);

		const queryString = params.toString();
		const url = `/admin/students-cards${queryString ? `?${queryString}` : ''}`;

		return api.get<ApiResponse<{ cards: StudentCardInfo[] }>>(url);
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

	/**
	 * Download student cards as an A4 PDF
	 */
	public async downloadStudentCardsPDF(classId?: number, gradeLevel?: string, majorCode?: string) {
		const params = new URLSearchParams();
		if (classId) params.append('class_id', classId.toString());
		if (gradeLevel) params.append('grade_level', gradeLevel);
		if (majorCode) params.append('major_code', majorCode);

		const queryString = params.toString();
		const url = `/admin/students-cards/pdf${queryString ? `?${queryString}` : ''}`;

		const response = await api.get(url, { responseType: 'blob' });

		// Trigger a browser download
		const blob = new Blob([response.data], { type: 'application/pdf' });
		const downloadUrl = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = 'kartu-siswa.pdf';
		document.body.appendChild(a);
		a.click();
		a.remove();
		window.URL.revokeObjectURL(downloadUrl);
	}
}

export const studentService = new StudentService();
