import { api } from '$lib/utils/api';

import type { ApiResponse } from '$lib/types/api';
import type { Admin, AdminLoginResponse } from '$lib/types/auth';

import type { Permission } from '$lib/types/permissions';

/**
 * Handles the profile process for the admin
 */
class ProfileService {
	/**
	 * Login the admin
	 */
	public async login(email: string, password: string): Promise<ApiResponse<AdminLoginResponse>> {
		return await api.post('/auth/admin/login', { email, password }).then((res) => res.data);
	}

	/**
	 * Get the profile for the admin
	 */
	public async getProfile(): Promise<ApiResponse<{ admin: Admin; permissions: Permission[] }>> {
		const response = await api.get<ApiResponse<{ admin: Admin; permissions: Permission[] }>>('/auth/admin/me');
		return response.data;
	}

    /**
     * Update the profile for the admin
     */
    public async updateProfile() {

    }
}

export const profileService = new ProfileService();