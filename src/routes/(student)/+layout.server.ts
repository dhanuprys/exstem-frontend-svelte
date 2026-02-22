import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	let API_BASE_URL = env.INTERNAL_API_BASE_URL || 'http://localhost:8050';
	API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api/v1';

	try {
		const res = await fetch(`${API_BASE_URL}/public/settings`);
		const resJson = (await res.json()).data;

		return {
			settings: {
				school_location: resJson.school_location,
				school_logo_url: resJson.school_logo_url,
				school_name: resJson.school_name
			}
		};
	} catch (error) {
		console.error(error);
		return {
			settings: {
				school_location: '',
				school_logo_url: '',
				school_name: ''
			}
		};
	}
};
