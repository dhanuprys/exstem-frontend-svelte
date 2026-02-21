import { goto } from '$app/navigation';
import { env } from '$env/dynamic/public';
import axios from 'axios';
import { STORAGE_KEYS } from './constants';

export const API_BASE_URL = env.PUBLIC_API_BASE_URL || 'http://localhost:8050';

export const api = axios.create({
	baseURL: API_BASE_URL.replace(/\/$/, '') + '/api/v1',
	headers: {
		'Content-Type': 'application/json'
	}
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response.status === 401) {
			localStorage.removeItem(STORAGE_KEYS.TOKEN);

			if (
				window.location.pathname.startsWith('/admin') ||
				window.location.pathname.startsWith('/x')
			) {
				goto('/x');
			} else {
				goto('/login');
			}
		}
		return Promise.reject(error);
	}
);
