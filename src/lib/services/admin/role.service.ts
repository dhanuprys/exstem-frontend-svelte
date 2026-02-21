import { api } from '$lib/utils/api';
import type { ApiResponse } from '../../types/api';

export interface Role {
	id: number;
	name: string;
	created_at: string;
}

export interface RoleWithPermissions extends Role {
	permissions: string[];
}

export type CreateUpdateRolePayload = {
	name: string;
	permissions: string[];
};

export const roleService = {
	/**
	 * Get all roles including their permissions
	 * @returns Promise with API response containing roles
	 */
	getRolesWithPermissions: () => api.get<ApiResponse<RoleWithPermissions[]>>('/admin/roles/all'),

	/**
	 * Get a specific role by ID
	 * @param id Role ID
	 * @returns Promise with API response containing the role
	 */
	getRole: (id: number) => api.get<ApiResponse<RoleWithPermissions>>(`/admin/roles/${id}`),

	/**
	 * Create a new role
	 * @param payload Role data
	 * @returns Promise with API response
	 */
	createRole: (payload: CreateUpdateRolePayload) =>
		api.post<ApiResponse<RoleWithPermissions>>('/admin/roles', payload),

	/**
	 * Update an existing role
	 * @param id Role ID
	 * @param payload Updated role data
	 * @returns Promise with API response
	 */
	updateRole: (id: number, payload: CreateUpdateRolePayload) =>
		api.put<ApiResponse<RoleWithPermissions>>(`/admin/roles/${id}`, payload),

	/**
	 * Delete a role
	 * @param id Role ID
	 * @returns Promise with API response
	 */
	deleteRole: (id: number) => api.delete<ApiResponse<null>>(`/admin/roles/${id}`),

	/**
	 * Get all available system permissions
	 * @returns Promise with API response containing permissions list
	 */
	getPermissions: () => api.get<ApiResponse<string[]>>('/admin/roles/permissions')
};
