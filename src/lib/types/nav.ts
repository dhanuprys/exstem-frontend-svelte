import type { Permission } from './permissions';

export interface NavItem {
	title: string;
	url: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
		icon?: any;
		requiredPermission?: Permission;
	}[];
	badge?: string | number;
	requiredPermission?: Permission;
}

export interface NavGroup {
	label?: string;
	items: NavItem[];
}
