import { api } from '$lib/utils/api';

import type { ApiResponse } from '$lib/types/api';
import type { Student, StudentLoginResponse } from '$lib/types/auth';

/**
 * Handles the profile process for the student
 */
class ProfileService {
	/**
	 * Login the student
	 */
	public async login(nisn: string, password: string): Promise<ApiResponse<StudentLoginResponse>> {
		return await api.post('/auth/student/login', { nisn, password }).then((res) => res.data);
	}

	/**
	 * Get the profile for the student
	 */
	public async getProfile(): Promise<ApiResponse<{ student: Student }>> {
		return await api.get('/auth/student/me').then((res) => res.data);
	}

	/**
	 * Logout the student
	 */
	public async logout(): Promise<ApiResponse<void>> {
		return await api.post('/auth/student/logout').then((res) => res.data);
	}
}

export const profileService = new ProfileService();
