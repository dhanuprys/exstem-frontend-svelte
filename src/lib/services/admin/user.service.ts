import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

export interface AdminUser {
    id: number;
    email: string;
    name: string;
    role_id: number;
    role_name?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserRequest {
    email: string;
    name: string;
    password: string;
    role_id: number;
}

export interface UpdateUserRequest {
    email: string;
    name: string;
    password?: string;
    role_id: number;
}

export interface Role {
    id: number;
    name: string;
}

/**
 * Handles the user process for the admin
 */
class UserService {
    /**
     * Create a new user
     */
    public async createUser(data: CreateUserRequest) {
        return api.post<ApiResponse<AdminUser>>('/admin/users', data);
    }

    /**
     * Update an existing user
     */
    public async updateUser(id: number, data: UpdateUserRequest) {
        return api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data);
    }

    /**
     * Get all the users for the admin
     */
    public async getUsers(page = 1, perPage = 10, roleId?: number) {
        const params: Record<string, any> = { page, per_page: perPage };
        if (roleId) params.role_id = roleId;
        return api.get<ApiResponse<AdminUser[]>>('/admin/users', { params });
    }

    /**
     * Delete a user
     */
    public async deleteUser(id: number) {
        return api.delete<ApiResponse<{ message: string }>>(`/admin/users/${id}`);
    }

    /**
     * Get available roles
     */
    public async getRoles() {
        return api.get<ApiResponse<Role[]>>('/admin/roles');
    }
}

export const userService = new UserService();