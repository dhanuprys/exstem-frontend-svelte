import { profileService } from '$lib/services/student/profile.service';
import type { Student } from '$lib/types/auth';
import type { ErrorBody } from '$lib/types/api';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { STORAGE_KEYS } from '$lib/utils/constants';

class ProfileStore {
	student = $state<Student | null>(null);

	constructor() {
		if (browser) {
			const storedStudent = localStorage.getItem(STORAGE_KEYS.STUDENT);
			if (storedStudent) {
				this.student = JSON.parse(storedStudent);
			}
		}
	}

	async login(nisn: string, password: string) {
		try {
			const response = await profileService.login(nisn, password);
			this.student = response.data.student;
			if (browser) {
				localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
				localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(this.student));
			}
			goto('/');
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
			goto('/login');
			return;
		}

		try {
			const response = await profileService.getProfile();
			this.student = response.data.student;
			localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(this.student));
		} catch (error) {
			console.error('Failed to fetch profile', error);
			this.logout();
		}
	}

	logout() {
		if (browser) {
			profileService.logout().finally(() => {
				localStorage.removeItem(STORAGE_KEYS.TOKEN);
				localStorage.removeItem(STORAGE_KEYS.STUDENT);
				this.student = null;
				goto('/login');
			});
		}
	}
}

export const profileStore = new ProfileStore();
