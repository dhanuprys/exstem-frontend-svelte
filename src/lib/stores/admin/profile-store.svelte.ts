import { profileService } from '$lib/services/admin/profile.service';
import type { Admin } from '$lib/types/auth';
import type { ErrorBody } from '$lib/types/api';
import type { Permission } from '$lib/types/permissions';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { STORAGE_KEYS } from '$lib/utils/constants';

class ProfileStore {
	admin = $state<Admin | null>(null);
	permissions = $state<Permission[]>([]);

	constructor() {
		if (browser) {
			const storedAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN);
			const storedPermissions = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
			if (storedAdmin) {
				this.admin = JSON.parse(storedAdmin);
			}
			if (storedPermissions) {
				this.permissions = JSON.parse(storedPermissions);
			}
		}
	}

	async login(email: string, password: string) {
		try {
			const response = await profileService.login(email, password);
			this.admin = response.data.admin;
			this.permissions = response.data.permissions;

			if (browser) {
				localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
				localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(this.admin));
				localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(this.permissions));
			}

			goto('/admin');
			return { success: true };
		} catch (error: any) {
			console.error('Login failed', error);
			const errorBody = error.response?.data?.error as ErrorBody;
			return { success: false, error: errorBody };
		}
	}

	async init() {
		if (!browser) return;

		const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
		if (!token) {
			goto('/x');
			return;
		}

		try {
			const response = await profileService.getProfile();
			this.admin = response.data.admin;
			this.permissions = response.data.permissions;
			localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(this.admin));
			localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(this.permissions));
		} catch (error) {
			console.error('Failed to fetch profile', error);
			this.logout();
		}
	}

	logout() {
		this.admin = null;
		this.permissions = [];
		if (browser) {
			localStorage.removeItem(STORAGE_KEYS.TOKEN);
			localStorage.removeItem(STORAGE_KEYS.ADMIN);
			localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
		}
		goto('/x');
	}
}

export const profileStore = new ProfileStore();